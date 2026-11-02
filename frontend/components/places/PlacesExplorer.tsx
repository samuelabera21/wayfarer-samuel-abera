"use client";

import { useEffect, useState, startTransition } from "react";
import type { Place, PlaceCategory } from "../../lib/types";
import { fetchPlaces } from "../../lib/places-api";
import { CategoryFilter } from "./CategoryFilter";
import { SortControl } from "./SortControl";
import { PlacesList } from "./PlacesList";
import { PlaceDetail } from "./PlaceDetail";

export function PlacesExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>("All");
  const [sortBy, setSortBy] = useState<"default" | "top-rated">("default");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const data = await fetchPlaces({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          sort: sortBy === "top-rated" ? "top-rated" : undefined,
        });

        if (!isCancelled) {
          startTransition(() => {
            setPlaces(data);
            setSelectedPlaceId((currentId) => {
              if (data.length === 0) return null;
              const exists = data.some((p) => p.id === currentId);
              return exists ? currentId : (data[0]?.id ?? null);
            });
            setError(null);
            setIsLoading(false);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load places";
          startTransition(() => {
            setError(message);
            setPlaces([]);
            setSelectedPlaceId(null);
            setIsLoading(false);
          });
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, sortBy, retryCount]);

  const selectedPlace =
    places.find((p) => p.id === selectedPlaceId) ?? (places[0] || null);

  const handleSelectCategory = (category: PlaceCategory) => {
    setSelectedCategory(category);
    setIsLoading(true);
  };

  const handleSortChange = (newSort: "default" | "top-rated") => {
    setSortBy(newSort);
    setIsLoading(true);
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setRetryCount((c) => c + 1);
  };

  const handlePlaceUpdated = () => {
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6">
      {/* Category filters bar (Sticky on desktop, matching UI sketch) */}
      <div className="sticky top-[61px] z-20 bg-slate-50 py-3 border-b border-slate-200">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* Master-Detail Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Places List with Sort control right above it, matching UI sketch */}
        <section
          aria-label="Places directory"
          className="lg:col-span-5 lg:sticky lg:top-[128px] lg:self-start lg:max-h-[calc(100vh-9.5rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200"
        >
          {/* Sort control bar directly above places list */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <SortControl
              sortBy={sortBy}
              onChange={handleSortChange}
            />
            <span className="text-xs text-slate-500 font-medium">
              {isLoading
                ? "Discovering places..."
                : `${places.length} ${places.length === 1 ? "place" : "places"}`}
            </span>
          </div>

          <PlacesList
            places={places}
            selectedPlaceId={selectedPlace?.id ?? null}
            onSelectPlace={handleSelectPlace}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        </section>

        {/* Right Column: Place Details (Scrolls freely so guided tours, bookings, and reviews are fully accessible) */}
        <section
          aria-label="Place details"
          className="lg:col-span-7 min-w-0 pb-12"
        >
          <PlaceDetail
            place={selectedPlace}
            isLoading={isLoading && places.length === 0}
            onReviewSubmitted={handlePlaceUpdated}
          />
        </section>
      </div>
    </div>
  );
}
