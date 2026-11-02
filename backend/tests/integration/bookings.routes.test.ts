import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

vi.mock("../../src/config/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      tourSlot: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe("Bookings API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/tour-slots/:slotId/bookings", () => {
    it("1. successfully creates a new booking (201 Created)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: 1n, capacity: 10 }]),
          booking: {
            findUnique: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([{ seats: 4 }]),
            upsert: vi.fn().mockResolvedValue({
              id: 77n,
              slotId: 1n,
              userId: 1n,
              seats: 3,
              createdAt: new Date("2026-11-02T10:00:00.000Z"),
            }),
          },
        };
        return await callback(mockTx);
      });

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 3 });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        id: 77,
        slotId: 1,
        userId: 1,
        seats: 3,
        capacity: 10,
        totalBookedSeats: 7,
        remainingSeats: 3,
      });
    });

    it("2. updates an existing booking when user books the same slot again (200 OK)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: 1n, capacity: 10 }]),
          booking: {
            findUnique: vi.fn().mockResolvedValue({ id: 77n, seats: 3 }),
            findMany: vi.fn().mockResolvedValue([{ seats: 7 }]), // 4 others + 3 user
            upsert: vi.fn().mockResolvedValue({
              id: 77n,
              slotId: 1n,
              userId: 1n,
              seats: 5,
              createdAt: new Date("2026-11-02T10:00:00.000Z"),
            }),
          },
        };
        return await callback(mockTx);
      });

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: 77,
        seats: 5,
        totalBookedSeats: 9, // 7 - 3 + 5
        remainingSeats: 1,
      });
    });

    it("3. rejects request when X-User-Id header is missing (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .send({ seats: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing X-User-Id header/i);
    });

    it("4. rejects request when X-User-Id header is invalid (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "invalid-id")
        .send({ seats: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid X-User-Id header/i);
    });

    it("5. returns 404 when acting user does not exist in the database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "999")
        .send({ seats: 2 });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/User not found/i);
    });

    it("6. rejects request when slot ID is invalid (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/tour-slots/abc/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid tour slot ID/i);
    });

    it("7. rejects request when seats field is missing (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Seats is required/i);
    });

    it("8. rejects request when seats <= 0 (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Seats must be a positive integer/i);
    });

    it("9. rejects request when seats is a decimal number (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 2.5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Seats must be an integer/i);
    });

    it("10. returns 404 when tour slot does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([]), // Empty: not found
        };
        return await callback(mockTx);
      });

      const res = await request(app)
        .post("/api/tour-slots/999/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 2 });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Tour slot not found/i);
    });

    it("11. returns 409 Conflict when requested seats exceed capacity", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: 1n, capacity: 10 }]),
          booking: {
            findUnique: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([{ seats: 9 }]), // 9 booked, only 1 left
          },
        };
        return await callback(mockTx);
      });

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 3 }); // Wants 3, only 1 left

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Insufficient remaining capacity/i);
    });

    it("12. returns 409 Conflict 'Tour slot is fully booked' when 0 seats are remaining", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: 1n, capacity: 10 }]),
          booking: {
            findUnique: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([{ seats: 10 }]), // 10/10 booked
          },
        };
        return await callback(mockTx);
      });

      const res = await request(app)
        .post("/api/tour-slots/1/bookings")
        .set("X-User-Id", "1")
        .send({ seats: 1 });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Tour slot is fully booked/i);
    });
  });
});

