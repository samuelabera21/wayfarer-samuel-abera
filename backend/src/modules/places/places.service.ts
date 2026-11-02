import { prisma as defaultPrisma } from "../../config/prisma.js";
import { calculateBayesianRating } from "./ranking.service.js";
import type { GetPlacesQuery, PlaceResponse } from "./places.types.js";

/**
 * Retrieves places from the database with Bayesian Weighted Ratings.
 *
 * Query execution strategy:
 * 1. Fetch matching places (with optional category filter).
 * 2. If no places match, exit early with an empty list.
 * 3. In parallel, fetch:
 *    - Overall average rating across all individual reviews in the database (C)
 *    - Grouped average rating and count per place (R, v)
 * 4. Calculate Bayesian Weighted Rating for each place in-memory.
 * 5. Sort by weighted rating if sort="top-rated", or preserve default ordering.
 *
 * Performance considerations:
 * - Avoids N+1 queries by using Prisma's `aggregate` and `groupBy`.
 * - Does not fetch review text or unnecessary place columns.
 */
export async function getPlaces(
  query: GetPlacesQuery = {},
  prisma = defaultPrisma
): Promise<PlaceResponse[]> {
  const { category, sort } = query;

  // 1. Fetch places matching category filter
  const places = await prisma.place.findMany({
    where: category ? { category } : {},
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      openingHours: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (places.length === 0) {
    return [];
  }

  const placeIds = places.map((place) => place.id);

  // 2. Fetch overall rating average (C) and per-place statistics (R, v) in parallel
  const [overallStats, placeStats] = await Promise.all([
    prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    }),
    prisma.review.groupBy({
      by: ["placeId"],
      where: {
        placeId: { in: placeIds },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    }),
  ]);

  const overallAverage = overallStats._avg.rating ?? 0;

  // 3. Build a fast lookup map for review stats keyed by placeId
  const statsMap = new Map<string, { avg: number | null; count: number }>();
  for (const stat of placeStats) {
    statsMap.set(stat.placeId.toString(), {
      avg: stat._avg.rating,
      count: stat._count.rating,
    });
  }

  // 4. Assemble PlaceResponse objects with ratings
  const result: PlaceResponse[] = places.map((place) => {
    const stat = statsMap.get(place.id.toString());
    const reviewCount = stat ? stat.count : 0;
    const averageRating =
      stat && stat.avg !== null
        ? Math.round(stat.avg * 100) / 100
        : null;

    const weightedRating = calculateBayesianRating(
      averageRating,
      reviewCount,
      overallAverage
    );

    return {
      id: Number(place.id),
      name: place.name,
      category: place.category,
      description: place.description,
      openingHours: place.openingHours,
      averageRating,
      reviewCount,
      weightedRating,
    };
  });

  // 5. Apply top-rated sorting if requested
  if (sort === "top-rated") {
    result.sort((a, b) => {
      // Primary: Highest weighted rating first
      if (b.weightedRating !== a.weightedRating) {
        return b.weightedRating - a.weightedRating;
      }
      // Secondary: More reviews first
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      // Stable tertiary: ID ascending
      return a.id - b.id;
    });
  }

  return result;
}
