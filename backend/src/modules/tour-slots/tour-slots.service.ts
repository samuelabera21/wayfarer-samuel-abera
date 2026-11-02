import { prisma as defaultPrisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { TourSlotResponse } from "./tour-slots.types.js";

interface RawTourSlotWithRelations {
  id: bigint;
  placeId: bigint;
  startsAt: Date;
  capacity: number;
  place: {
    id: bigint;
    name: string;
  };
  bookings: {
    seats: number;
  }[];
}

/**
 * Formats a raw Prisma tour slot record into a client-safe response.
 * Calculates booked seats and remaining seats.
 * Enforces that remaining seats cannot be negative.
 */
export function formatTourSlot(slot: RawTourSlotWithRelations): TourSlotResponse {
  const bookedSeats = slot.bookings.reduce((total, booking) => total + booking.seats, 0);
  const remainingSeats = Math.max(0, slot.capacity - bookedSeats);

  return {
    id: Number(slot.id),
    startTime: slot.startsAt.toISOString(),
    startsAt: slot.startsAt.toISOString(),
    capacity: slot.capacity,
    bookedSeats,
    remainingSeats,
    place: {
      id: Number(slot.place.id),
      name: slot.place.name,
    },
  };
}

/**
 * Retrieves all tour slots for a given place in chronological order (earliest first).
 * Throws 404 if the place does not exist.
 * Avoids N+1 queries by retrieving bookings within the single relational query.
 */
export async function getTourSlotsByPlaceId(
  placeId: number,
  prisma = defaultPrisma
): Promise<TourSlotResponse[]> {
  const [place, slots] = await Promise.all([
    prisma.place.findUnique({
      where: { id: BigInt(placeId) },
      select: { id: true },
    }),
    prisma.tourSlot.findMany({
      where: { placeId: BigInt(placeId) },
      orderBy: { startsAt: "asc" },
      include: {
        place: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
          select: {
            seats: true,
          },
        },
      },
    }),
  ]);

  if (!place) {
    throw new AppError("Place not found", 404);
  }

  return slots.map(formatTourSlot);
}

/**
 * Retrieves a single tour slot by ID with its availability information.
 * Throws 404 if the tour slot does not exist.
 */
export async function getTourSlotById(
  slotId: number,
  prisma = defaultPrisma
): Promise<TourSlotResponse> {
  const slot = await prisma.tourSlot.findUnique({
    where: { id: BigInt(slotId) },
    include: {
      place: {
        select: {
          id: true,
          name: true,
        },
      },
      bookings: {
        select: {
          seats: true,
        },
      },
    },
  });

  if (!slot) {
    throw new AppError("Tour slot not found", 404);
  }

  return formatTourSlot(slot);
}

