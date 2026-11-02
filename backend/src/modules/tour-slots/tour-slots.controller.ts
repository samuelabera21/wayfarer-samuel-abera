import type { Request, Response, NextFunction } from "express";
import { validatePlaceId, validateSlotId } from "./tour-slots.validation.js";
import {
  getTourSlotsByPlaceId,
  getTourSlotById,
} from "./tour-slots.service.js";

/**
 * Handles GET /api/places/:placeId/tour-slots
 * Returns all tour slots for a place ordered earliest first with availability stats.
 */
export async function getPlaceTourSlotsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const placeId = validatePlaceId(req.params.placeId);
    const slots = await getTourSlotsByPlaceId(placeId);

    res.status(200).json({
      data: slots,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles GET /api/tour-slots/:slotId
 * Returns a single tour slot with current availability stats.
 */
export async function getTourSlotByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slotId = validateSlotId(req.params.slotId);
    const slot = await getTourSlotById(slotId);

    res.status(200).json({
      data: slot,
    });
  } catch (error) {
    next(error);
  }
}

