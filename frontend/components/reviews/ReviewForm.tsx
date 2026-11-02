"use client";

import { useState, type FormEvent } from "react";
import type { Review } from "../../lib/types";
import { submitPlaceReview } from "../../lib/reviews-api";
import { useUser } from "../../context/UserContext";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  placeId: number;
  existingReview: Review | null;
  onSuccess: () => void;
}

export function ReviewForm({
  placeId,
  existingReview,
  onSuccess,
}: ReviewFormProps) {
  const { currentUser } = useUser();
  const [rating, setRating] = useState<number>(existingReview?.rating ?? 5);
  const [comment, setComment] = useState<string>(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setErrorMessage("Please select a traveller before reviewing.");
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setErrorMessage("Review comment cannot be empty.");
      return;
    }

    if (trimmedComment.length > 500) {
      setErrorMessage("Review comment cannot exceed 500 characters.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please provide a rating between 1 and 5 stars.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await submitPlaceReview(placeId, {
        rating,
        comment: trimmedComment,
      });

      setSuccessMessage(
        existingReview
          ? "Your review has been updated!"
          : "Your review has been submitted!"
      );
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit review";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdating = Boolean(existingReview);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {isUpdating ? "Update your review" : "Leave a review"}
        </h4>
        {currentUser && (
          <span className="text-xs text-slate-500 font-medium">
            Reviewing as{" "}
            <strong className="text-slate-700">{currentUser.name}</strong>
          </span>
        )}
      </div>

      {/* Star Rating Picker */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-600">Your rating:</span>
        <StarRating value={rating} onChange={setRating} size="lg" />
        <span className="text-xs font-semibold text-slate-700 ml-1">
          {rating} / 5
        </span>
      </div>

      {/* Comment text area */}
      <div className="space-y-1">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (atmosphere, service, highlights)..."
          maxLength={500}
          rows={3}
          required
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all placeholder:text-slate-400"
        />
        <div className="flex justify-end text-[11px] text-slate-400">
          <span>{comment.length} / 500 characters</span>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3 text-xs text-red-700 bg-red-100/70 border border-red-200 rounded-lg">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-100/70 border border-emerald-200 rounded-lg">
          ✓ {successMessage}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
        >
          {isSubmitting
            ? "Submitting..."
            : isUpdating
              ? "Update review"
              : "Submit review"}
        </button>
      </div>
    </form>
  );
}

