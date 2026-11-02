export const MIN_REVIEW_THRESHOLD = 5;

/**
 * Calculates the Bayesian Weighted Rating for a place.
 *
 * Formula:
 * W = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * Where:
 * - W = final weighted rating
 * - R = average rating of the individual place
 * - v = number of reviews for that place
 * - m = minimum review threshold (default = 5)
 * - C = overall average rating across all reviews
 *
 * Notes:
 * - If a place has no reviews (v = 0 or R is null), the weighted rating is 0.
 * - Handles an empty dataset (C = 0) and zero reviews safely without division by zero.
 * - Pure calculation independent of Express and Prisma.
 */
export function calculateBayesianRating(
  placeAverageRating: number | null,
  placeReviewCount: number,
  overallAverageRating: number,
  minReviewThreshold: number = MIN_REVIEW_THRESHOLD
): number {
  if (placeReviewCount <= 0 || placeAverageRating === null) {
    return 0;
  }

  const v = placeReviewCount;
  const m = minReviewThreshold;
  const R = placeAverageRating;
  const C = overallAverageRating || 0;

  if (v + m <= 0) {
    return 0;
  }

  const weighted = (v / (v + m)) * R + (m / (v + m)) * C;
  return Math.round(weighted * 100) / 100;
}

