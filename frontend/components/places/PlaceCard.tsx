"use client";

import type { Place } from "../../lib/types";
import { PlaceImage } from "./PlaceImage";

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place) => void;
}

export function PlaceCard({ place, isSelected, onSelect }: PlaceCardProps) {
  const formattedRating =
    place.averageRating !== null ? place.averageRating.toFixed(1) : null;
  const reviewLabel =
    place.reviewCount === 1
      ? "1 review"
      : `${place.reviewCount} reviews`;

  return (
    <article
      onClick={() => onSelect(place)}
      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
        isSelected
          ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
      }`}
    >
      <div className="overflow-hidden rounded-xl aspect-16/10 mb-3 bg-slate-100">
        <PlaceImage
          src={place.imageUrl}
          alt={place.name}
          category={place.category}
          className="w-full h-full transform hover:scale-102 transition-transform duration-300"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1">
          {place.name}
        </h3>

        <div className="flex items-center text-xs text-slate-500 font-medium">
          <span>{place.category}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          {formattedRating ? (
            <div className="inline-flex items-center text-slate-700">
              <span className="text-amber-500 mr-1 text-sm leading-none">★</span>
              <span className="font-semibold mr-1">{formattedRating}</span>
              <span className="text-slate-400">({reviewLabel})</span>
            </div>
          ) : (
            <span className="text-slate-400">No reviews yet</span>
          )}
        </div>
      </div>
    </article>
  );
}

