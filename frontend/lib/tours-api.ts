import { apiFetch } from "./api";
import type { TourSlot, BookingResponse } from "./types";

interface TourSlotsResponse {
  data: TourSlot[];
}

interface SingleBookingResponse {
  data: BookingResponse;
}

/**
 * Fetches all guided tour slots for a given place, ordered chronologically.
 */
export async function fetchPlaceTourSlots(placeId: number): Promise<TourSlot[]> {
  const response = await apiFetch<TourSlotsResponse>(
    `/api/places/${placeId}/tour-slots`
  );
  return response.data;
}

/**
 * Books seats in a specific tour slot for the acting user.
 * The active X-User-Id header is automatically injected by apiFetch.
 */
export async function bookTourSlot(
  slotId: number,
  seats: number
): Promise<BookingResponse> {
  const response = await apiFetch<SingleBookingResponse>(
    `/api/tour-slots/${slotId}/bookings`,
    {
      method: "POST",
      body: JSON.stringify({ seats }),
    }
  );
  return response.data;
}

