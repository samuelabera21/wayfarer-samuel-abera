import { prisma as defaultPrisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreateOrUpdateBookingInput,
  CreateOrUpdateBookingResult,
} from "./bookings.types.js";

/**
 * Creates a new booking or updates an existing booking for a user in a specific tour slot.
 *
 * Concurrency & Integrity guarantees:
 * 1. Uses an interactive PostgreSQL transaction.
 * 2. Locks the target `tour_slots` row using `SELECT ... FOR UPDATE` before reading capacity or bookings.
 * 3. Calculates total booked seats across all reservations in the slot.
 * 4. If the user already has a booking, replaces (updates) their previous seat count.
 * 5. Rejects with HTTP 409 Conflict if total seats would exceed slot capacity.
 * 6. Atomically creates or updates the reservation using `booking.upsert`.
 */
export async function createOrUpdateBooking(
  input: CreateOrUpdateBookingInput,
  prisma = defaultPrisma
): Promise<CreateOrUpdateBookingResult> {
  const { slotId, userId, seats: requestedSeats } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Lock the selected TourSlot row using PostgreSQL SELECT ... FOR UPDATE
    const lockedSlots = await tx.$queryRaw<Array<{ id: bigint; capacity: number }>>`
      SELECT "id", "capacity" FROM "tour_slots" WHERE "id" = ${BigInt(slotId)} FOR UPDATE
    `;

    if (lockedSlots.length === 0 || !lockedSlots[0]) {
      throw new AppError("Tour slot not found", 404);
    }

    const slot = lockedSlots[0];
    const capacity = slot.capacity;

    // 2. Find the current user's existing booking for this slot (if any)
    const existingBooking = await tx.booking.findUnique({
      where: {
        slotId_userId: {
          slotId: BigInt(slotId),
          userId: BigInt(userId),
        },
      },
      select: {
        id: true,
        seats: true,
      },
    });

    // 3. Calculate total seats currently booked in this slot
    const allBookings = await tx.booking.findMany({
      where: {
        slotId: BigInt(slotId),
      },
      select: {
        seats: true,
      },
    });

    const currentTotalBookedSeats = allBookings.reduce(
      (sum, b) => sum + b.seats,
      0
    );

    // 4. Calculate new total seats for the slot
    const existingUserSeats = existingBooking ? existingBooking.seats : 0;
    const newTotalBookedSeats = currentTotalBookedSeats - existingUserSeats + requestedSeats;
    const availableSeatsForUser = capacity - (currentTotalBookedSeats - existingUserSeats);

    // 5. Check capacity constraint
    if (newTotalBookedSeats > capacity) {
      if (availableSeatsForUser <= 0) {
        throw new AppError("Tour slot is fully booked", 409);
      }
      throw new AppError(
        `Insufficient remaining capacity. Requested: ${requestedSeats}, available: ${availableSeatsForUser}`,
        409
      );
    }

    // 6. Atomically create or update the booking
    const booking = await tx.booking.upsert({
      where: {
        slotId_userId: {
          slotId: BigInt(slotId),
          userId: BigInt(userId),
        },
      },
      create: {
        slotId: BigInt(slotId),
        userId: BigInt(userId),
        seats: requestedSeats,
      },
      update: {
        seats: requestedSeats,
      },
    });

    const remainingSeats = capacity - newTotalBookedSeats;

    return {
      booking: {
        id: Number(booking.id),
        slotId: Number(booking.slotId),
        userId: Number(booking.userId),
        seats: booking.seats,
        capacity,
        totalBookedSeats: newTotalBookedSeats,
        remainingSeats,
        createdAt: booking.createdAt.toISOString(),
      },
      isCreated: !existingBooking,
    };
  });
}

