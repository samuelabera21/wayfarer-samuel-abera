import { prisma as defaultPrisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreateOrUpdateReviewInput,
  CreateOrUpdateReviewResult,
  ReviewResponse,
} from "./reviews.types.js";

/**
 * Creates a new review or updates an existing one for the same user and place.
 *
 * Enforces the business rule: One review per user per place.
 * Uses an atomic Prisma upsert backed by the @@unique([placeId, userId]) constraint.
 */
export async function createOrUpdateReview(
  input: CreateOrUpdateReviewInput,
  prisma = defaultPrisma
): Promise<CreateOrUpdateReviewResult> {
  const { placeId, userId, rating, comment } = input;

  // 1. Verify place exists
  const place = await prisma.place.findUnique({
    where: { id: BigInt(placeId) },
    select: { id: true },
  });

  if (!place) {
    throw new AppError("Place not found", 404);
  }

  // 2. Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { id: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 3. Check for pre-existing review to determine create vs update status code
  const existingReview = await prisma.review.findUnique({
    where: {
      placeId_userId: {
        placeId: BigInt(placeId),
        userId: BigInt(userId),
      },
    },
    select: { id: true },
  });

  // 4. Atomic upsert to prevent race conditions and duplicate reviews
  const review = await prisma.review.upsert({
    where: {
      placeId_userId: {
        placeId: BigInt(placeId),
        userId: BigInt(userId),
      },
    },
    create: {
      placeId: BigInt(placeId),
      userId: BigInt(userId),
      rating,
      body: comment,
    },
    update: {
      rating,
      body: comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    review: {
      id: Number(review.id),
      placeId: Number(review.placeId),
      rating: review.rating,
      comment: review.body,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      user: {
        id: Number(review.user.id),
        name: review.user.name,
      },
    },
    isCreated: !existingReview,
  };
}

/**
 * Retrieves all reviews for a specific place ordered newest first.
 * Throws 404 if the place does not exist.
 */
export async function getReviewsByPlaceId(
  placeId: number,
  prisma = defaultPrisma
): Promise<ReviewResponse[]> {
  // 1. Verify place exists
  const place = await prisma.place.findUnique({
    where: { id: BigInt(placeId) },
    select: { id: true },
  });

  if (!place) {
    throw new AppError("Place not found", 404);
  }

  // 2. Fetch reviews with author information (newest first)
  const reviews = await prisma.review.findMany({
    where: { placeId: BigInt(placeId) },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return reviews.map((r) => ({
    id: Number(r.id),
    placeId: Number(r.placeId),
    rating: r.rating,
    comment: r.body,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: {
      id: Number(r.user.id),
      name: r.user.name,
    },
  }));
}

