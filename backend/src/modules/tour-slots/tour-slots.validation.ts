import { AppError } from "../../utils/AppError.js";

/**
 * Validates that a route parameter is a valid positive integer.
 */
function validatePositiveInteger(val: unknown, paramName: string): number {
  const parsed = Number(val);
  if (!val || !Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${paramName}: must be a positive integer`, 400);
  }
  return parsed;
}

export function validatePlaceId(param: unknown): number {
  return validatePositiveInteger(param, "place ID");
}

export function validateSlotId(param: unknown): number {
  return validatePositiveInteger(param, "tour slot ID");
}

