import type { Request, Response, NextFunction } from "express";
import { validatePlaceId, validateReviewBody } from "./reviews.validation.js";
import {
  createOrUpdateReview,
  getReviewsByPlaceId,
} from "./reviews.service.js";

/**
 * Handles POST /api/places/:placeId/reviews
 * Creates or updates a review for the authenticated acting user.
 */
export async function createOrUpdateReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const placeId = validatePlaceId(req.params.placeId);
    const { rating, comment } = validateReviewBody(req.body);
    const userId = Number(req.currentUser!.id);

    const result = await createOrUpdateReview({
      placeId,
      userId,
      rating,
      comment,
    });

    res.status(result.isCreated ? 201 : 200).json({
      data: result.review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles GET /api/places/:placeId/reviews
 * Returns all reviews for a place ordered newest first.
 */
export async function getPlaceReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const placeId = validatePlaceId(req.params.placeId);
    const reviews = await getReviewsByPlaceId(placeId);

    res.status(200).json({
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
}

