"use client";

import { useEffect, useState, useCallback, startTransition, useMemo } from "react";
import type { TourSlot } from "../../lib/types";
import { fetchPlaceTourSlots } from "../../lib/tours-api";
import { TourSlotItem } from "./TourSlotItem";

interface TourSlotsSectionProps {
  placeId: number;
}

const SLOTS_PER_PAGE = 2;

export function TourSlotsSection({ placeId }: TourSlotsSectionProps) {
  const [slots, setSlots] = useState<TourSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(0);

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

  // Split slots into chunks of SLOTS_PER_PAGE for horizontal sliding
  const pages = useMemo(() => {
    const chunks: TourSlot[][] = [];
    for (let i = 0; i < slots.length; i += SLOTS_PER_PAGE) {
      chunks.push(slots.slice(i, i + SLOTS_PER_PAGE));
    }
    return chunks;
  }, [slots]);

  const totalPages = Math.max(1, pages.length);
  const safePage = Math.min(page, totalPages - 1);

  return (
    <section aria-label="Guided tours" className="space-y-3 pt-4 border-t border-slate-100">
      {/* Header with Title and Horizontal Carousel Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Guided tours
          </h3>
          {!isLoading && !error && slots.length > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              ({slots.length} available)
            </span>
          )}
        </div>

        {/* Carousel pagination arrows (only visible if more than 1 page) */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              {safePage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Previous tour slots"
                className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs text-xs font-bold"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                aria-label="Next tour slots"
                className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs text-xs font-bold"
              >
                ›
              </button>
            </div>
          </div>
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
        <div className="space-y-2">
          {/* Horizontal sliding container */}
          <div className="overflow-hidden w-full rounded-2xl">
            <div
              className="flex transition-transform duration-300 ease-in-out will-change-transform"
              style={{ transform: `translateX(-${safePage * 100}%)` }}
            >
              {pages.map((pageSlots, pageIdx) => (
                <div
                  key={pageIdx}
                  className="w-full shrink-0 space-y-2.5"
                  aria-hidden={pageIdx !== safePage}
                >
                  {pageSlots.map((slot) => (
                    <TourSlotItem
                      key={slot.id}
                      slot={slot}
                      onBookSuccess={handleBookSuccess}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Indicator dots for multiple pages */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-1">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  aria-label={`Go to tour slots page ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safePage
                      ? "w-4 bg-[#102a4e]"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

