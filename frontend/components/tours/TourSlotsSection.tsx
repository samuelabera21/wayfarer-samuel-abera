"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import type { TourSlot } from "../../lib/types";
import { fetchPlaceTourSlots } from "../../lib/tours-api";
import { TourSlotItem } from "./TourSlotItem";

interface TourSlotsSectionProps {
  placeId: number;
}

export function TourSlotsSection({ placeId }: TourSlotsSectionProps) {
  const [slots, setSlots] = useState<TourSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadSlots() {
      try {
        const data = await fetchPlaceTourSlots(placeId);
        if (!isCancelled) {
          startTransition(() => {
            setSlots(data);
            setError(null);
            setIsLoading(false);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load tour slots.";
          startTransition(() => {
            setError(message);
            setIsLoading(false);
          });
        }
      }
    }

    loadSlots();

    return () => {
      isCancelled = true;
    };
  }, [placeId, reloadKey]);

  const handleBookSuccess = useCallback(() => {
    // Refresh slots availability after a booking
    setReloadKey((prev) => prev + 1);
  }, []);

  return (
    <section aria-label="Guided tours" className="space-y-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Guided tours
        </h3>
        {!isLoading && !error && slots.length > 0 && (
          <span className="text-xs text-slate-400 font-medium">
            {slots.length} {slots.length === 1 ? "slot" : "slots"} available
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((id) => (
            <div
              key={id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/3" />
              </div>
              <div className="h-8 bg-slate-200 rounded-lg w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center justify-between">
          <span>Failed to load tour slots: {error}</span>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((k) => k + 1);
            }}
            className="font-semibold text-red-800 hover:underline cursor-pointer ml-3"
          >
            Retry
          </button>
        </div>
      ) : slots.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <p className="text-xs text-slate-500">
            No guided tour slots currently scheduled for this place.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {slots.map((slot) => (
            <TourSlotItem
              key={slot.id}
              slot={slot}
              onBookSuccess={handleBookSuccess}
            />
          ))}
        </div>
      )}
    </section>
  );
}

