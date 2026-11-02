"use client";

import type { Place } from "../../lib/types";
import { PlaceCard } from "./PlaceCard";

interface PlacesListProps {
  places: Place[];
  selectedPlaceId: number | null;
  onSelectPlace: (place: Place) => void;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function PlacesList({
  places,
  selectedPlaceId,
  onSelectPlace,
  isLoading,
  error,
  onRetry,
}: PlacesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((skeletonId) => (
          <div
            key={skeletonId}
            className="p-3 rounded-2xl border border-slate-200 bg-white animate-pulse"
          >
            <div className="rounded-xl aspect-16/10 bg-slate-200 mb-3" />
            <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2" />
            <div className="h-3 bg-slate-200 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-center">
        <svg
          width="40"
          height="40"
          style={{ width: "40px", height: "40px" }}
          className="w-10 h-10 text-red-400 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm font-semibold text-red-800 mb-1">
          Unable to load places
        </p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
        <svg
          width="40"
          height="40"
          style={{ width: "40px", height: "40px" }}
          className="w-10 h-10 text-slate-300 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm font-semibold text-slate-700">No places found</p>
        <p className="text-xs text-slate-500 mt-1">
          Try choosing another category or clearing your filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          isSelected={place.id === selectedPlaceId}
          onSelect={onSelectPlace}
        />
      ))}
    </div>
  );
}

