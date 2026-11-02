import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrUpdateBooking } from "../../src/modules/bookings/bookings.service.js";
import { AppError } from "../../src/utils/AppError.js";

describe("bookings.service - Unit Tests", () => {
  const mockTx = {
    $queryRaw: vi.fn(),
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };

  const mockPrisma = {
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<any>) => {
      return await cb(mockTx);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. creates a new booking for multiple seats successfully (201 Created)", async () => {
    // Slot capacity: 10
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    // No existing booking for this user
    mockTx.booking.findUnique.mockResolvedValue(null);
    // Other existing bookings: 2 seats
    mockTx.booking.findMany.mockResolvedValue([{ seats: 2 }]);
    // Upsert return
    mockTx.booking.upsert.mockResolvedValue({
      id: 101n,
      slotId: 1n,
      userId: 1n,
      seats: 3,
      createdAt: new Date("2026-11-02T10:00:00Z"),
    });

    const result = await createOrUpdateBooking(
      { slotId: 1, userId: 1, seats: 3 },
      mockPrisma as any
    );

    expect(result.isCreated).toBe(true);
    expect(result.booking).toMatchObject({
      id: 101,
      slotId: 1,
      userId: 1,
      seats: 3,
      capacity: 10,
      totalBookedSeats: 5, // 2 + 3
      remainingSeats: 5,
    });
    expect(mockTx.$queryRaw).toHaveBeenCalled();
  });

  it("2. allows a different user to book the exact remaining seats", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    mockTx.booking.findUnique.mockResolvedValue(null);
    mockTx.booking.findMany.mockResolvedValue([{ seats: 7 }]); // 7 booked, 3 remaining
    mockTx.booking.upsert.mockResolvedValue({
      id: 102n,
      slotId: 1n,
      userId: 2n,
      seats: 3,
      createdAt: new Date("2026-11-02T11:00:00Z"),
    });

    const result = await createOrUpdateBooking(
      { slotId: 1, userId: 2, seats: 3 },
      mockPrisma as any
    );

    expect(result.isCreated).toBe(true);
    expect(result.booking.totalBookedSeats).toBe(10);
    expect(result.booking.remainingSeats).toBe(0);
  });

  it("3. rejects request with 409 when requested seats exceed available capacity", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    mockTx.booking.findUnique.mockResolvedValue(null);
    mockTx.booking.findMany.mockResolvedValue([{ seats: 8 }]); // 8 booked, only 2 remaining

    await expect(
      createOrUpdateBooking({ slotId: 1, userId: 3, seats: 3 }, mockPrisma as any)
    ).rejects.toThrowError(
      new AppError("Insufficient remaining capacity. Requested: 3, available: 2", 409)
    );

    expect(mockTx.booking.upsert).not.toHaveBeenCalled();
  });

  it("4. rejects request with 409 'Tour slot is fully booked' when 0 seats remain", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    mockTx.booking.findUnique.mockResolvedValue(null);
    mockTx.booking.findMany.mockResolvedValue([{ seats: 10 }]); // Fully booked

    await expect(
      createOrUpdateBooking({ slotId: 1, userId: 2, seats: 1 }, mockPrisma as any)
    ).rejects.toThrowError(new AppError("Tour slot is fully booked", 409));

    expect(mockTx.booking.upsert).not.toHaveBeenCalled();
  });

  it("5. updates an existing booking's seats value rather than adding to old quantity", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    // User already has a booking of 2 seats
    mockTx.booking.findUnique.mockResolvedValue({ id: 50n, seats: 2 });
    // Total currently in slot: 6 seats (including user's 2 seats)
    mockTx.booking.findMany.mockResolvedValue([{ seats: 4 }, { seats: 2 }]);
    // Upsert preserves ID 50n with new seats: 4
    mockTx.booking.upsert.mockResolvedValue({
      id: 50n,
      slotId: 1n,
      userId: 1n,
      seats: 4,
      createdAt: new Date("2026-11-01T10:00:00Z"),
    });

    const result = await createOrUpdateBooking(
      { slotId: 1, userId: 1, seats: 4 },
      mockPrisma as any
    );

    expect(result.isCreated).toBe(false);
    expect(result.booking.id).toBe(50);
    expect(result.booking.seats).toBe(4);
    // (6 total - 2 previous + 4 requested) = 8
    expect(result.booking.totalBookedSeats).toBe(8);
    expect(result.booking.remainingSeats).toBe(2);
  });

  it("6. rejects increasing an existing booking when the new total exceeds capacity", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    // User already booked 2 seats, others booked 7 seats -> total 9 booked, 1 seat unbooked
    // User wants to increase reservation from 2 to 4 seats (+2 seats, but only 1 available)
    mockTx.booking.findUnique.mockResolvedValue({ id: 50n, seats: 2 });
    mockTx.booking.findMany.mockResolvedValue([{ seats: 7 }, { seats: 2 }]);

    await expect(
      createOrUpdateBooking({ slotId: 1, userId: 1, seats: 4 }, mockPrisma as any)
    ).rejects.toThrowError(
      new AppError("Insufficient remaining capacity. Requested: 4, available: 3", 409)
    );

    expect(mockTx.booking.upsert).not.toHaveBeenCalled();
  });

  it("7. correctly reduces an existing booking's seat quantity and increases remaining capacity", async () => {
    mockTx.$queryRaw.mockResolvedValue([{ id: 1n, capacity: 10 }]);
    // User booked 4 seats, total 10 booked (0 remaining)
    // User reduces reservation to 2 seats
    mockTx.booking.findUnique.mockResolvedValue({ id: 50n, seats: 4 });
    mockTx.booking.findMany.mockResolvedValue([{ seats: 6 }, { seats: 4 }]);
    mockTx.booking.upsert.mockResolvedValue({
      id: 50n,
      slotId: 1n,
      userId: 1n,
      seats: 2,
      createdAt: new Date("2026-11-01T10:00:00Z"),
    });

    const result = await createOrUpdateBooking(
      { slotId: 1, userId: 1, seats: 2 },
      mockPrisma as any
    );

    expect(result.isCreated).toBe(false);
    expect(result.booking.seats).toBe(2);
    // (10 - 4 + 2) = 8 booked
    expect(result.booking.totalBookedSeats).toBe(8);
    expect(result.booking.remainingSeats).toBe(2);
  });

  it("8. throws 404 when tour slot does not exist", async () => {
    mockTx.$queryRaw.mockResolvedValue([]); // No slot found for update

    await expect(
      createOrUpdateBooking({ slotId: 999, userId: 1, seats: 2 }, mockPrisma as any)
    ).rejects.toThrowError(new AppError("Tour slot not found", 404));

    expect(mockTx.booking.upsert).not.toHaveBeenCalled();
  });

  it("propagates database errors thrown within the transaction", async () => {
    mockTx.$queryRaw.mockRejectedValue(new Error("Deadlock detected"));

    await expect(
      createOrUpdateBooking({ slotId: 1, userId: 1, seats: 2 }, mockPrisma as any)
    ).rejects.toThrow("Deadlock detected");
  });
});

