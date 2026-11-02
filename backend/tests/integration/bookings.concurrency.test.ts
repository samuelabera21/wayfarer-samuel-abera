import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

/**
 * Real PostgreSQL Concurrency Integration Test.
 *
 * Verifies that PostgreSQL `SELECT ... FOR UPDATE` row-level locks and Prisma interactive
 * transactions serialize concurrent booking requests and strictly prevent overbooking.
 *
 * Scenario:
 * - A slot has capacity: 10
 * - Existing reservation: 8 seats (remaining: 2)
 * - 5 concurrent requests arrive simultaneously, each requesting 2 seats.
 * - Expected: Exactly 1 succeeds (201 Created), 4 fail with 409 Conflict, and final booked seats = 10.
 */
describe("Bookings Real PostgreSQL Concurrency Test", () => {
  let testPlaceId: bigint;
  let testSlotId: bigint;
  const createdUserIds: bigint[] = [];

  beforeAll(async () => {
    // 1. Create an isolated test place
    const place = await prisma.place.create({
      data: {
        name: `Concurrency Test Place ${Date.now()}`,
        category: "Test",
        description: "Isolated place for concurrency test",
      },
    });
    testPlaceId = place.id;

    // 2. Create an isolated tour slot with capacity: 10
    const slot = await prisma.tourSlot.create({
      data: {
        placeId: testPlaceId,
        startsAt: new Date(Date.now() + 86400000), // 24h from now
        capacity: 10,
      },
    });
    testSlotId = slot.id;

    // 3. Create test users: 1 initial user + 5 competing candidates
    for (let i = 0; i < 6; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Concurrency Tester ${Date.now()} ${i}`,
        },
      });
      createdUserIds.push(user.id);
    }

    // 4. Initial booker reserves 8 seats -> exactly 2 seats remaining
    const initialUserId = createdUserIds[0]!;
    await prisma.booking.create({
      data: {
        slotId: testSlotId,
        userId: initialUserId,
        seats: 8,
      },
    });
  });

  afterAll(async () => {
    // Clean up ONLY the isolated records created specifically for this test
    if (testSlotId) {
      await prisma.booking.deleteMany({ where: { slotId: testSlotId } });
      await prisma.tourSlot.delete({ where: { id: testSlotId } }).catch(() => {});
    }
    if (testPlaceId) {
      await prisma.place.delete({ where: { id: testPlaceId } }).catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
    }
  });

  it("safely serializes concurrent booking requests, allowing exactly one to take remaining seats and rejecting all others with 409", async () => {
    const candidateUsers = createdUserIds.slice(1); // 5 competing users

    // Send 5 concurrent booking requests in parallel, each asking for 2 seats
    const responses = await Promise.all(
      candidateUsers.map((userId) =>
        request(app)
          .post(`/api/tour-slots/${testSlotId}/bookings`)
          .set("X-User-Id", userId.toString())
          .send({ seats: 2 })
      )
    );

    const successResponses = responses.filter((r) => r.status === 201);
    const conflictResponses = responses.filter((r) => r.status === 409);

    // Exactly 1 request succeeds
    expect(successResponses).toHaveLength(1);
    expect(successResponses[0]!.body.data).toMatchObject({
      slotId: Number(testSlotId),
      seats: 2,
      capacity: 10,
      totalBookedSeats: 10,
      remainingSeats: 0,
    });

    // Exactly 4 requests are rejected with 409 Conflict
    expect(conflictResponses).toHaveLength(4);
    for (const res of conflictResponses) {
      expect(res.body.error).toMatch(/Insufficient remaining capacity|fully booked/i);
    }

    // Verify in the real database that no overbooking occurred
    const bookingsInDb = await prisma.booking.findMany({
      where: { slotId: testSlotId },
    });

    // Total records = initial booking + 1 winning booking = 2
    expect(bookingsInDb).toHaveLength(2);

    const totalSeatsInDb = bookingsInDb.reduce((sum, b) => sum + b.seats, 0);
    expect(totalSeatsInDb).toBe(10); // Exactly capacity, never exceeded
  });
});

