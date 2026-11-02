/**
 * Shared TypeScript domain models for the Wayfarer frontend.
 */

export interface Place {
  id: number;
  name: string;
  category: string;
  description: string;
  openingHours: string | null;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  weightedRating: number;
}

export interface User {
  id: number;
  name: string;
}

export interface Review {
  id: number;
  placeId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
  };
}

export interface TourSlot {
  id: number;
  startTime: string;
  startsAt: string;
  capacity: number;
  bookedSeats: number;
  remainingSeats: number;
  place?: {
    id: number;
    name: string;
  };
}

export interface BookingResponse {
  id: number;
  slotId: number;
  userId: number;
  seats: number;
  capacity: number;
  totalBookedSeats: number;
  remainingSeats: number;
  createdAt: string;
}

export const PLACE_CATEGORIES = [
  "All",
  "History",
  "Food",
  "Nature",
  "Culture",
  "Education",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

