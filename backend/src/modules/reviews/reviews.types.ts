export interface ReviewUserResponse {
  id: number;
  name: string;
}

export interface ReviewResponse {
  id: number;
  placeId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUserResponse;
}

export interface CreateOrUpdateReviewInput {
  placeId: number;
  userId: number;
  rating: number;
  comment: string;
}

export interface CreateOrUpdateReviewResult {
  review: ReviewResponse;
  isCreated: boolean;
}

