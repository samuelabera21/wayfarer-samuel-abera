export interface PlaceResponse {
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

export type SortMode = "top-rated";

export interface GetPlacesQuery {
  category?: string | undefined;
  sort?: SortMode | undefined;
}
