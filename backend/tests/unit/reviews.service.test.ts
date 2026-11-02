import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrUpdateReview,
  getReviewsByPlaceId,
} from "../../src/modules/reviews/reviews.service.js";
import { AppError } from "../../src/utils/AppError.js";

describe("reviews.service - Unit Tests", () => {
  const mockPrisma = {
    place: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrUpdateReview", () => {
    const input = {
      placeId: 1,
      userId: 2,
      rating: 5,
      comment: "Spectacular place!",
    };

    it("creates a new review when no review exists for the user and place", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2n, name: "Samuel" });
      mockPrisma.review.findUnique.mockResolvedValue(null); // No existing review
      mockPrisma.review.upsert.mockResolvedValue({
        id: 10n,
        placeId: 1n,
        userId: 2n,
        rating: 5,
        body: "Spectacular place!",
        createdAt: new Date("2026-11-02T10:00:00Z"),
        updatedAt: new Date("2026-11-02T10:00:00Z"),
        user: {
          id: 2n,
          name: "Samuel",
        },
      });

      const result = await createOrUpdateReview(input, mockPrisma as any);

      expect(result.isCreated).toBe(true);
      expect(result.review).toMatchObject({
        id: 10,
        placeId: 1,
        rating: 5,
        comment: "Spectacular place!",
        user: {
          id: 2,
          name: "Samuel",
        },
      });

      expect(mockPrisma.review.upsert).toHaveBeenCalledWith({
        where: {
          placeId_userId: {
            placeId: 1n,
            userId: 2n,
          },
        },
        create: {
          placeId: 1n,
          userId: 2n,
          rating: 5,
          body: "Spectacular place!",
        },
        update: {
          rating: 5,
          body: "Spectacular place!",
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
    });

    it("updates an existing review and preserves the review ID", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2n, name: "Samuel" });
      mockPrisma.review.findUnique.mockResolvedValue({ id: 42n }); // Pre-existing review
      mockPrisma.review.upsert.mockResolvedValue({
        id: 42n, // Same ID preserved
        placeId: 1n,
        userId: 2n,
        rating: 4,
        body: "Updated comment.",
        createdAt: new Date("2026-11-01T08:00:00Z"),
        updatedAt: new Date("2026-11-02T11:00:00Z"),
        user: {
          id: 2n,
          name: "Samuel",
        },
      });

      const updateInput = {
        placeId: 1,
        userId: 2,
        rating: 4,
        comment: "Updated comment.",
      };

      const result = await createOrUpdateReview(updateInput, mockPrisma as any);

      expect(result.isCreated).toBe(false);
      expect(result.review.id).toBe(42);
      expect(result.review.rating).toBe(4);
      expect(result.review.comment).toBe("Updated comment.");
    });

    it("associates the review with the correct user and place relationships", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 5n });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 3n, name: "Fanos" });
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.review.upsert.mockResolvedValue({
        id: 15n,
        placeId: 5n,
        userId: 3n,
        rating: 3,
        body: "Decent visit.",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 3n, name: "Fanos" },
      });

      const customInput = {
        placeId: 5,
        userId: 3,
        rating: 3,
        comment: "Decent visit.",
      };

      const result = await createOrUpdateReview(customInput, mockPrisma as any);

      expect(mockPrisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            placeId: 5n,
            userId: 3n,
          }),
        })
      );
      expect(result.review.placeId).toBe(5);
      expect(result.review.user.id).toBe(3);
    });

    it("throws 404 when place does not exist", async () => {
      mockPrisma.place.findUnique.mockResolvedValue(null);

      await expect(
        createOrUpdateReview(input, mockPrisma as any)
      ).rejects.toThrowError(new AppError("Place not found", 404));

      expect(mockPrisma.review.upsert).not.toHaveBeenCalled();
    });

    it("throws 404 when user does not exist", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createOrUpdateReview(input, mockPrisma as any)
      ).rejects.toThrowError(new AppError("User not found", 404));

      expect(mockPrisma.review.upsert).not.toHaveBeenCalled();
    });

    it("propagates database errors thrown by Prisma upsert", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2n });
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.review.upsert.mockRejectedValue(new Error("Database connection timeout"));

      await expect(
        createOrUpdateReview(input, mockPrisma as any)
      ).rejects.toThrow("Database connection timeout");
    });
  });

  describe("getReviewsByPlaceId", () => {
    it("retrieves reviews for a place ordered newest first with reviewer information", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: 2n,
          placeId: 1n,
          userId: 3n,
          rating: 5,
          body: "Newer review",
          createdAt: new Date("2026-11-02T12:00:00Z"),
          updatedAt: new Date("2026-11-02T12:00:00Z"),
          user: { id: 3n, name: "Fanos" },
        },
        {
          id: 1n,
          placeId: 1n,
          userId: 2n,
          rating: 4,
          body: "Older review",
          createdAt: new Date("2026-11-01T08:00:00Z"),
          updatedAt: new Date("2026-11-01T08:00:00Z"),
          user: { id: 2n, name: "Samuel" },
        },
      ]);

      const reviews = await getReviewsByPlaceId(1, mockPrisma as any);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { placeId: 1n },
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

      expect(reviews).toHaveLength(2);
      expect(reviews[0]!.comment).toBe("Newer review");
      expect(reviews[0]!.user.name).toBe("Fanos");
      expect(reviews[1]!.comment).toBe("Older review");
      expect(reviews[1]!.user.name).toBe("Samuel");
    });

    it("throws 404 when place does not exist", async () => {
      mockPrisma.place.findUnique.mockResolvedValue(null);

      await expect(
        getReviewsByPlaceId(999, mockPrisma as any)
      ).rejects.toThrowError(new AppError("Place not found", 404));

      expect(mockPrisma.review.findMany).not.toHaveBeenCalled();
    });

    it("returns an empty array if the place has no reviews", async () => {
      mockPrisma.place.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.review.findMany.mockResolvedValue([]);

      const reviews = await getReviewsByPlaceId(1, mockPrisma as any);

      expect(reviews).toEqual([]);
    });
  });
});
