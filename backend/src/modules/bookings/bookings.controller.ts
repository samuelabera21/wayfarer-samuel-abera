import type { Request, Response, NextFunction } from "express";
import { validateSlotId, validateBookingBody } from "./bookings.validation.js";
import { createOrUpdateBooking } from "./bookings.service.js";

/**
 * Handles POST /api/tour-slots/:slotId/bookings
 * Reserves seats in a tour slot for the authenticated user.
 */
export async function createOrUpdateBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId = validateSlotId(req.params.slotId);
    const { seats } = validateBookingBody(req.body);
    const userId = Number(req.currentUser!.id);

    const result = await createOrUpdateBooking({
      slotId,
      userId,
      seats,
    });

    res.status(result.isCreated ? 201 : 200).json({
      data: result.booking,
    });
  } catch (error) {
    next(error);
  }
}

