"use client";

import { useState } from "react";
import type { TourSlot } from "../../lib/types";
import { bookTourSlot } from "../../lib/tours-api";
import { useUser } from "../../context/UserContext";

interface TourSlotItemProps {
  slot: TourSlot;
  onBookSuccess: () => void;
}

function formatSlotTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

export function TourSlotItem({ slot, onBookSuccess }: TourSlotItemProps) {
  const { currentUser } = useUser();
  const [selectedSeats, setSelectedSeats] = useState<number>(1);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isFull = slot.remainingSeats <= 0;
  const maxSelectable = Math.min(slot.remainingSeats, 10);

  const handleBook = async () => {
    if (isFull) return;

    if (!currentUser) {
      setError("Please select a traveller from the header before booking.");
      return;
    }

    setIsBooking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await bookTourSlot(slot.id, selectedSeats);
      setSuccessMessage(
        `Successfully booked ${result.seats} seat${result.seats > 1 ? "s" : ""}!`
      );
      // Notify parent to refresh slot availability
      onBookSuccess();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to complete booking. Please try again.";
      setError(message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isFull
          ? "bg-slate-50/80 border-slate-200 opacity-90"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Time and Availability info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {formatSlotTime(slot.startsAt || slot.startTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isFull ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-700">
                Fully booked
              </span>
            ) : (
              <span className="inline-flex items-center font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {slot.remainingSeats} of {slot.capacity} seats left
              </span>
            )}
          </div>
        </div>

        {/* Booking action controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isFull ? (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
            >
              Full
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor={`seats-slot-${slot.id}`} className="sr-only">
                Seats for slot {slot.id}
              </label>
              <select
                id={`seats-slot-${slot.id}`}
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(Number(e.target.value))}
                disabled={isBooking}
                aria-label={`Number of seats for tour at ${formatSlotTime(slot.startsAt)}`}
                className="text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer disabled:opacity-50"
              >
                {Array.from({ length: maxSelectable }, (_, i) => i + 1).map(
                  (num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "seat" : "seats"}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={handleBook}
                disabled={isBooking}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#102a4e] hover:bg-[#0c203b] text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
              >
                {isBooking ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Book</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline success feedback */}
      {successMessage && (
        <div
          role="status"
          className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between"
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline error feedback */}
      {error && (
        <div
          role="alert"
          className="mt-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center justify-between"
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 cursor-pointer text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

