"use client";

import type { Place } from "../../lib/types";
import { PlaceImage } from "./PlaceImage";
import { TourSlotsSection } from "../tours/TourSlotsSection";
import { ReviewsSection } from "../reviews/ReviewsSection";

interface PlaceDetailProps {
  place: Place | null;
  isLoading?: boolean;
  onReviewSubmitted?: () => void;
}

export function PlaceDetail({
  place,
  isLoading = false,
  onReviewSubmitted,
}: PlaceDetailProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 animate-pulse space-y-6">
        <div className="rounded-2xl aspect-16/9 bg-slate-200 w-full" />
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 rounded-md w-2/3" />
          <div className="h-4 bg-slate-200 rounded-md w-1/3" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-slate-200 rounded-md w-1/4" />
          <div className="h-4 bg-slate-200 rounded-md w-full" />
          <div className="h-4 bg-slate-200 rounded-md w-5/6" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
        <svg
          width="48"
          height="48"
          style={{ width: "48px", height: "48px" }}
          className="w-12 h-12 mx-auto mb-3 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-sm font-medium text-slate-600">No place selected</p>
        <p className="text-xs text-slate-400 mt-1">
          Choose a place from the list to view full details.
        </p>
      </div>
    );
  }

  const formattedRating =
    place.averageRating !== null ? place.averageRating.toFixed(1) : null;
  const reviewLabel =
    place.reviewCount === 1 ? "1 review" : `${place.reviewCount} reviews`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Hero Image */}
      <div className="p-4 sm:p-6 pb-0">
        <div className="overflow-hidden rounded-2xl aspect-16/9 bg-slate-100">
          <PlaceImage
            src={place.imageUrl}
            alt={place.name}
            category={place.category}
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header metadata */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {place.name}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 text-sm text-slate-600 font-medium">
            <span className="text-slate-700">{place.category}</span>
            <span className="mx-2 text-slate-300">·</span>

            {formattedRating ? (
              <div className="inline-flex items-center text-slate-800">
                <span className="text-amber-500 mr-1 text-base">★</span>
                <span className="font-semibold mr-1">{formattedRating}</span>
                <span className="text-slate-400">({reviewLabel})</span>
              </div>
            ) : (
              <span className="text-slate-400">No reviews yet</span>
            )}

            {place.openingHours && (
              <>
                <span className="mx-2 text-slate-300">·</span>
                <span className="inline-flex items-center text-slate-600">
                  <svg
                    width="14"
                    height="14"
                    style={{ width: "14px", height: "14px" }}
                    className="w-3.5 h-3.5 mr-1 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Open {place.openingHours}
                </span>
              </>
            )}
          </div>
        </div>

        {/* About section */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            About this place
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            {place.description}
          </p>
        </div>

        {/* Guided Tours and Booking Section */}
        <TourSlotsSection placeId={place.id} />

        {/* Reviews Section */}
        <ReviewsSection
          placeId={place.id}
          onReviewSubmitted={onReviewSubmitted}
        />
      </div>
    </div>
  );
}

