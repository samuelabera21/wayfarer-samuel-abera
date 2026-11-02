import { z } from "zod";
import { AppError } from "../../utils/AppError.js";

const reviewBodySchema = z.object({
  rating: z
    .number({ error: "Rating is required" })
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string({ error: "Comment is required" })
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
});

export function validatePlaceId(param: unknown): number {
  const parsed = Number(param);
  if (!param || !Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("Invalid place ID: must be a positive integer", 400);
  }
  return parsed;
}

export function validateReviewBody(body: unknown): {
  rating: number;
  comment: string;
} {
  const result = reviewBodySchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(message, 400);
  }

  return result.data;
}

