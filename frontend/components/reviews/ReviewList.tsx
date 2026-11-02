"use client";

import type { Review } from "../../lib/types";
import { StarRating } from "./StarRating";

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

export function ReviewList({ reviews, isLoading, error }: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 animate-pulse space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded-md w-24" />
              <div className="h-3 bg-slate-200 rounded-md w-16" />
            </div>
            <div className="h-3.5 bg-slate-200 rounded-md w-full" />
            <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-center">
        <p className="text-xs text-red-600 font-medium">
          Unable to load reviews for this place. ({error})
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
        <span className="text-xl mb-1 block">💬</span>
        <p className="text-xs font-semibold text-slate-700">No reviews yet</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Be the first traveller to share honest feedback on this destination.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const formattedDate = new Date(review.createdAt).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        );

        return (
          <article
            key={review.id}
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {review.user.name}
                </span>
                <StarRating value={review.rating} readOnly size="sm" />
              </div>
              <time
                dateTime={review.createdAt}
                className="text-[11px] text-slate-400"
              >
                {formattedDate}
              </time>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          </article>
        );
      })}
    </div>
  );
}

