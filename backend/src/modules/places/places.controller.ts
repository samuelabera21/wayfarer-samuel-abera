import type { Request, Response, NextFunction } from "express";
import { validateGetPlacesQuery } from "./places.validation.js";
import { getPlaces } from "./places.service.js";

/**
 * Handles HTTP requests to GET /api/places.
 * Validates query parameters and delegates business logic to places service.
 */
export async function getPlacesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedQuery = validateGetPlacesQuery(req.query);
    const places = await getPlaces(validatedQuery);
    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
}

