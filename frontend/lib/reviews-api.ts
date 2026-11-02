import { apiFetch } from "./api";
import type { Review } from "./types";

interface ReviewsResponse {
  data: Review[];
}

interface SingleReviewResponse {
  data: Review;
}

export interface SubmitReviewInput {
  rating: number;
  comment: string;
}

/**
 * Fetches all reviews for a specific place, ordered newest first.
 */
export async function fetchPlaceReviews(placeId: number): Promise<Review[]> {
  const response = await apiFetch<ReviewsResponse>(
    `/api/places/${placeId}/reviews`
  );
  return response.data;
}

/**
 * Submits or updates a review for a specific place by the acting user.
 * The active X-User-Id header is automatically injected by apiFetch.
 */
export async function submitPlaceReview(
  placeId: number,
  input: SubmitReviewInput
): Promise<Review> {
  const response = await apiFetch<SingleReviewResponse>(
    `/api/places/${placeId}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return response.data;
}

