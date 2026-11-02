import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

vi.mock("../../src/config/prisma.js", () => {
  return {
    prisma: {
      place: {
        findUnique: vi.fn(),
      },
      tourSlot: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

describe("Tour Slots API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/places/:placeId/tour-slots", () => {
    it("1 & 7. successfully retrieves tour slots with correct response structure ({ data: [...] })", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n, name: "Debre Birhan Palace" } as any);
      vi.mocked(prisma.tourSlot.findMany).mockResolvedValue([
        {
          id: 1n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T09:00:00.000Z"),
          capacity: 10,
          place: { id: 1n, name: "Debre Birhan Palace" },
          bookings: [{ seats: 4 }],
        },
      ] as any);

      const res = await request(app).get("/api/places/1/tour-slots");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);

      const slot = res.body.data[0];
      expect(slot).toMatchObject({
        id: 1,
        startTime: "2026-11-07T09:00:00.000Z",
        capacity: 10,
        bookedSeats: 4,
        remainingSeats: 6,
        place: {
          id: 1,
          name: "Debre Birhan Palace",
        },
      });
      expect(typeof slot.id).toBe("number");
      expect(typeof slot.capacity).toBe("number");
      expect(typeof slot.bookedSeats).toBe("number");
      expect(typeof slot.remainingSeats).toBe("number");
    });

    it("2. rejects invalid place ID with 400 Bad Request", async () => {
      const invalidPlaceIds = ["abc", "0", "-5", "1.5"];
      for (const placeId of invalidPlaceIds) {
        const res = await request(app).get(`/api/places/${placeId}/tour-slots`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid place ID/i);
      }
    });

    it("3. returns 404 when place ID does not exist", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue(null);

      const res = await request(app).get("/api/places/999/tour-slots");

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Place not found/i);
    });

    it("4. returns an empty array ({ data: [] }) when place has no tour slots", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 2n, name: "Quiet Park" } as any);
      vi.mocked(prisma.tourSlot.findMany).mockResolvedValue([]);

      const res = await request(app).get("/api/places/2/tour-slots");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("5. correctly calculates booked and remaining seats with multiple booking entries", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n, name: "Palace" } as any);
      vi.mocked(prisma.tourSlot.findMany).mockResolvedValue([
        {
          id: 1n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T09:00:00.000Z"),
          capacity: 12,
          place: { id: 1n, name: "Palace" },
          bookings: [
            { seats: 3 },
            { seats: 5 },
            { seats: 2 },
          ], // Total 10 booked
        },
      ] as any);

      const res = await request(app).get("/api/places/1/tour-slots");

      expect(res.status).toBe(200);
      expect(res.body.data[0].capacity).toBe(12);
      expect(res.body.data[0].bookedSeats).toBe(10);
      expect(res.body.data[0].remainingSeats).toBe(2);
    });

    it("6. verifies slots are ordered chronologically (earliest first)", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n, name: "Palace" } as any);
      vi.mocked(prisma.tourSlot.findMany).mockResolvedValue([
        {
          id: 1n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T09:00:00.000Z"),
          capacity: 10,
          place: { id: 1n, name: "Palace" },
          bookings: [],
        },
        {
          id: 2n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T14:00:00.000Z"),
          capacity: 10,
          place: { id: 1n, name: "Palace" },
          bookings: [],
        },
      ] as any);

      const res = await request(app).get("/api/places/1/tour-slots");

      expect(res.status).toBe(200);
      expect(prisma.tourSlot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startsAt: "asc" },
        })
      );
      expect(res.body.data[0].id).toBe(1);
      expect(res.body.data[1].id).toBe(2);
    });
  });

  describe("GET /api/tour-slots/:slotId - Single Tour Slot Endpoint", () => {
    it("successfully retrieves a single tour slot with availability information", async () => {
      vi.mocked(prisma.tourSlot.findUnique).mockResolvedValue({
        id: 7n,
        placeId: 3n,
        startsAt: new Date("2026-11-08T10:00:00.000Z"),
        capacity: 8,
        place: { id: 3n, name: "Highland Nature Trail" },
        bookings: [{ seats: 5 }],
      } as any);

      const res = await request(app).get("/api/tour-slots/7");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: 7,
        startTime: "2026-11-08T10:00:00.000Z",
        capacity: 8,
        bookedSeats: 5,
        remainingSeats: 3,
        place: {
          id: 3,
          name: "Highland Nature Trail",
        },
      });
    });

    it("rejects invalid slot ID with 400 Bad Request", async () => {
      const res = await request(app).get("/api/tour-slots/not-a-number");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid tour slot ID/i);
    });

    it("returns 404 when tour slot does not exist", async () => {
      vi.mocked(prisma.tourSlot.findUnique).mockResolvedValue(null);

      const res = await request(app).get("/api/tour-slots/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Tour slot not found/i);
    });
  });
});

