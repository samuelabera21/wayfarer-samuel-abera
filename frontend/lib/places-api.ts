import { apiFetch } from "./api";
import type { Place, PlaceCategory } from "./types";

export interface FetchPlacesParams {
  category?: PlaceCategory | string;
  sort?: "top-rated";
}

/**
 * Retrieves places from the Express API with optional category filtering
 * and Bayesian weighted rating sorting.
 */
export async function fetchPlaces(
  params: FetchPlacesParams = {}
): Promise<Place[]> {
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== "All") {
    queryParams.set("category", params.category);
  }

  if (params.sort) {
    queryParams.set("sort", params.sort);
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/places${queryString ? `?${queryString}` : ""}`;

  return apiFetch<Place[]>(endpoint);
}

