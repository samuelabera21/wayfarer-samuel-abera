import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTourSlotsByPlaceId,
  getTourSlotById,
  formatTourSlot,
} from "../../src/modules/tour-slots/tour-slots.service.js";
import { AppError } from "../../src/utils/AppError.js";

describe("tour-slots.service - Unit Tests", () => {
  const mockPrisma = {
    place: {
      findUnique: vi.fn(),
    },
    tourSlot: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatTourSlot calculation", () => {
    it("2 & 3. correctly calculates booked seats and remaining seats for multiple bookings", () => {
      const rawSlot = {
        id: 1n,
        placeId: 1n,
        startsAt: new Date("2026-11-07T09:00:00Z"),
        capacity: 10,
        place: { id: 1n, name: "Debre Birhan Palace" },
        bookings: [
          { seats: 2 },
          { seats: 5 },
        ],
      };

      const result = formatTourSlot(rawSlot);

      expect(result.capacity).toBe(10);
      expect(result.bookedSeats).toBe(7);
      expect(result.remainingSeats).toBe(3);
    });

    it("4. handles slots with zero bookings safely", () => {
      const rawSlot = {
        id: 2n,
        placeId: 1n,
        startsAt: new Date("2026-11-07T11:00:00Z"),
        capacity: 15,
        place: { id: 1n, name: "Debre Birhan Palace" },
        bookings: [],
      };

      const result = formatTourSlot(rawSlot);

      expect(result.bookedSeats).toBe(0);
      expect(result.remainingSeats).toBe(15);
    });

    it("5. correctly sums bookings where each reservation contains multiple seats", () => {
      const rawSlot = {
        id: 3n,
        placeId: 1n,
        startsAt: new Date("2026-11-07T14:00:00Z"),
        capacity: 20,
        place: { id: 1n, name: "Debre Birhan Palace" },
        bookings: [
          { seats: 4 },
          { seats: 6 },
          { seats: 8 },
        ],
      };

      const result = formatTourSlot(rawSlot);

      expect(result.bookedSeats).toBe(18);
      expect(result.remainingSeats).toBe(2);
    });

    it("does not allow negative remaining seats if bookings exceed capacity", () => {
      const overbookedSlot = {
        id: 4n,
        placeId: 1n,
        startsAt: new Date("2026-11-07T16:00:00Z"),
        capacity: 10,
        place: { id: 1n, name: "Debre Birhan Palace" },
        bookings: [
          { seats: 7 },
          { seats: 5 }, // Total 12 booked > 10 capacity
        ],
      };

      const result = formatTourSlot(overbookedSlot);

      expect(result.bookedSeats).toBe(12);
      expect(result.remainingSeats).toBe(0); // Clamped to 0
    });
  });

  describe("getTourSlotsByPlaceId", () => {
    it("1 & 6. returns slots for a place ordered chronologically (earliest first)", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.tourSlot.findMany.mockResolvedValue([
        {
          id: 10n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T09:00:00Z"),
          capacity: 10,
          place: { id: 1n, name: "Debre Birhan Palace" },
          bookings: [{ seats: 4 }],
        },
        {
          id: 11n,
          placeId: 1n,
          startsAt: new Date("2026-11-07T14:00:00Z"),
          capacity: 10,
          place: { id: 1n, name: "Debre Birhan Palace" },
          bookings: [{ seats: 10 }],
        },
      ]);

      const slots = await getTourSlotsByPlaceId(1, mockPrisma as any);

      expect(mockPrisma.tourSlot.findMany).toHaveBeenCalledWith({
        where: { placeId: 1n },
        orderBy: { startsAt: "asc" },
        include: {
          place: {
            select: { id: true, name: true },
          },
          bookings: {
            select: { seats: true },
          },
        },
      });

      expect(slots).toHaveLength(2);
      expect(slots[0]!.id).toBe(10);
      expect(slots[0]!.remainingSeats).toBe(6);
      expect(slots[1]!.id).toBe(11);
      expect(slots[1]!.remainingSeats).toBe(0);
    });

    it("7. handles a place with no tour slots returning an empty array", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.tourSlot.findMany.mockResolvedValue([]);

      const slots = await getTourSlotsByPlaceId(1, mockPrisma as any);

      expect(slots).toEqual([]);
    });

    it("throws 404 when place does not exist", async () => {
      mockPrisma.place.findUnique.mockResolvedValue(null);
      mockPrisma.tourSlot.findMany.mockResolvedValue([]);

      await expect(
        getTourSlotsByPlaceId(999, mockPrisma as any)
      ).rejects.toThrowError(new AppError("Place not found", 404));
    });

    it("8. propagates unexpected database errors", async () => {
      mockPrisma.place.findUnique.mockRejectedValue(new Error("Database connection error"));

      await expect(
        getTourSlotsByPlaceId(1, mockPrisma as any)
      ).rejects.toThrow("Database connection error");
    });
  });

  describe("getTourSlotById", () => {
    it("retrieves a single tour slot with availability information", async () => {
      mockPrisma.tourSlot.findUnique.mockResolvedValue({
        id: 5n,
        placeId: 2n,
        startsAt: new Date("2026-11-08T10:00:00Z"),
        capacity: 8,
        place: { id: 2n, name: "Menelik II Square" },
        bookings: [{ seats: 3 }],
      });

      const slot = await getTourSlotById(5, mockPrisma as any);

      expect(slot.id).toBe(5);
      expect(slot.capacity).toBe(8);
      expect(slot.bookedSeats).toBe(3);
      expect(slot.remainingSeats).toBe(5);
      expect(slot.place.name).toBe("Menelik II Square");
    });

    it("throws 404 when tour slot does not exist", async () => {
      mockPrisma.tourSlot.findUnique.mockResolvedValue(null);

      await expect(
        getTourSlotById(999, mockPrisma as any)
      ).rejects.toThrowError(new AppError("Tour slot not found", 404));
    });
  });
});

