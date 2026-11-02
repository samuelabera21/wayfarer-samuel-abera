"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import type { Review } from "../../lib/types";
import { fetchPlaceReviews } from "../../lib/reviews-api";
import { useUser } from "../../context/UserContext";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";

interface ReviewsSectionProps {
  placeId: number;
  onReviewSubmitted?: () => void;
}

export function ReviewsSection({
  placeId,
  onReviewSubmitted,
}: ReviewsSectionProps) {
  const { currentUser } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadReviews() {
      try {
        const data = await fetchPlaceReviews(placeId);
        if (!isCancelled) {
          startTransition(() => {
            setReviews(data);
            setError(null);
            setIsLoading(false);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load reviews";
          startTransition(() => {
            setError(message);
            setIsLoading(false);
          });
        }
      }
    }

    loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [placeId, reloadKey]);

  const handleReviewSuccess = useCallback(() => {
    // Trigger local re-fetch of reviews
    setReloadKey((prev) => prev + 1);
    // Notify parent to refresh places list and update ratings
    onReviewSubmitted?.();
  }, [onReviewSubmitted]);

  // Find if current acting user already has a review for this place
  const existingUserReview =
    currentUser && reviews.length > 0
      ? (reviews.find((r) => r.user.id === currentUser.id) ?? null)
      : null;

  return (
    <section aria-label="Place reviews" className="space-y-5 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Reviews ({reviews.length})
        </h3>
      </div>

      {/* Review submission or update form (placed at TOP for immediate visibility) */}
      <ReviewForm
        key={`${placeId}-${currentUser?.id ?? "guest"}-${existingUserReview?.id ?? "new"}`}
        placeId={placeId}
        existingReview={existingUserReview}
        onSuccess={handleReviewSuccess}
      />

      {/* Reviews list */}
      <ReviewList reviews={reviews} isLoading={isLoading} error={error} />
    </section>
  );
}

