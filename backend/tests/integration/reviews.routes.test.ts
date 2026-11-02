import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

vi.mock("../../src/config/prisma.js", () => {
  return {
    prisma: {
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
    },
  };
});

describe("Reviews API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/places/:placeId/reviews - Creating and Updating Reviews", () => {
    it("1. creates a new review when user reviews a place for the first time (201 Created)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.review.upsert).mockResolvedValue({
        id: 101n,
        placeId: 1n,
        userId: 1n,
        rating: 5,
        body: "A wonderful place to visit.",
        createdAt: new Date("2026-11-02T10:00:00.000Z"),
        updatedAt: new Date("2026-11-02T10:00:00.000Z"),
        user: { id: 1n, name: "Samuel" },
      } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({
          rating: 5,
          comment: "A wonderful place to visit.",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        id: 101,
        placeId: 1,
        rating: 5,
        comment: "A wonderful place to visit.",
        user: {
          id: 1,
          name: "Samuel",
        },
      });
      expect(prisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            placeId: 1n,
            userId: 1n,
            rating: 5,
            body: "A wonderful place to visit.",
          }),
        })
      );
    });

    it("2. updates an existing review when the same user reviews the same place again (200 OK)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 101n } as any);
      vi.mocked(prisma.review.upsert).mockResolvedValue({
        id: 101n,
        placeId: 1n,
        userId: 1n,
        rating: 4,
        body: "Updated comment: Still good but crowded.",
        createdAt: new Date("2026-11-01T09:00:00.000Z"),
        updatedAt: new Date("2026-11-02T11:00:00.000Z"),
        user: { id: 1n, name: "Samuel" },
      } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({
          rating: 4,
          comment: "Updated comment: Still good but crowded.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(101);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe("Updated comment: Still good but crowded.");
    });

    it("3. preserves the existing review ID when updating, avoiding duplicates", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 55n } as any);
      vi.mocked(prisma.review.upsert).mockResolvedValue({
        id: 55n, // Preserved review ID
        placeId: 1n,
        userId: 1n,
        rating: 5,
        body: "Even better on the second visit!",
        createdAt: new Date("2026-10-15T09:00:00.000Z"),
        updatedAt: new Date("2026-11-02T11:30:00.000Z"),
        user: { id: 1n, name: "Samuel" },
      } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({
          rating: 5,
          comment: "Even better on the second visit!",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(55);
    });

    it("4. allows two different users to review the same place independently", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 2n, name: "Fanos" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.review.upsert).mockResolvedValue({
        id: 102n,
        placeId: 1n,
        userId: 2n,
        rating: 4,
        body: "Fanos review for Place 1",
        createdAt: new Date("2026-11-02T12:00:00.000Z"),
        updatedAt: new Date("2026-11-02T12:00:00.000Z"),
        user: { id: 2n, name: "Fanos" },
      } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "2")
        .send({
          rating: 4,
          comment: "Fanos review for Place 1",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.name).toBe("Fanos");
      expect(prisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            placeId_userId: {
              placeId: 1n,
              userId: 2n,
            },
          },
        })
      );
    });

    it("5. verifies the returned review contains correct user and place fields", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 3n, name: "Nigus" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 8n } as any);
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.review.upsert).mockResolvedValue({
        id: 77n,
        placeId: 8n,
        userId: 3n,
        rating: 5,
        body: "Authentic atmosphere.",
        createdAt: new Date("2026-11-02T13:00:00.000Z"),
        updatedAt: new Date("2026-11-02T13:00:00.000Z"),
        user: { id: 3n, name: "Nigus" },
      } as any);

      const res = await request(app)
        .post("/api/places/8/reviews")
        .set("X-User-Id", "3")
        .send({
          rating: 5,
          comment: "Authentic atmosphere.",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.placeId).toBe(8);
      expect(res.body.data.user.id).toBe(3);
      expect(res.body.data.user.name).toBe("Nigus");
    });
  });

  describe("Validation & Error Scenarios", () => {
    it("6. rejects request when X-User-Id header is missing (400 Bad Request)", async () => {
      const res = await request(app)
        .post("/api/places/1/reviews")
        .send({
          rating: 5,
          comment: "Nice view.",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing X-User-Id header/i);
    });

    it("7. rejects request when X-User-Id header is not a positive integer (400 Bad Request)", async () => {
      const invalidHeaders = ["abc", "-1", "0", "1.5"];
      for (const val of invalidHeaders) {
        const res = await request(app)
          .post("/api/places/1/reviews")
          .set("X-User-Id", val)
          .send({ rating: 5, comment: "Nice view." });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid X-User-Id header/i);
      }
    });

    it("8. returns 404 when user ID does not exist in the database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "999")
        .send({ rating: 5, comment: "Nice view." });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/User not found/i);
    });

    it("9. rejects request when place ID in route is invalid (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const invalidPlaceIds = ["abc", "0", "-5"];
      for (const placeId of invalidPlaceIds) {
        const res = await request(app)
          .post(`/api/places/${placeId}/reviews`)
          .set("X-User-Id", "1")
          .send({ rating: 5, comment: "Nice view." });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid place ID/i);
      }
    });

    it("10. returns 404 when place ID does not exist in the database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);
      vi.mocked(prisma.place.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/places/999/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 5, comment: "Nice view." });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Place not found/i);
    });

    it("11. rejects request when rating is missing (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ comment: "Great place without a rating." });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Rating is required/i);
    });

    it("12. rejects request when rating is below 1 (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 0, comment: "Terrible" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Rating must be between 1 and 5/i);
    });

    it("13. rejects request when rating is above 5 (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 6, comment: "Beyond 5 stars!" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Rating must be between 1 and 5/i);
    });

    it("14. rejects request when rating is a decimal number (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 4.5, comment: "Four and a half" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Rating must be an integer/i);
    });

    it("15. rejects request when comment is missing or empty (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 5, comment: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Comment cannot be empty|Comment is required/i);
    });

    it("16. rejects request when comment contains only whitespace (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 5, comment: "    " });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Comment cannot be empty/i);
    });

    it("17. rejects request when comment exceeds 500 characters (400 Bad Request)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1n, name: "Samuel" } as any);

      const res = await request(app)
        .post("/api/places/1/reviews")
        .set("X-User-Id", "1")
        .send({ rating: 5, comment: "a".repeat(501) });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Comment cannot exceed 500 characters/i);
    });
  });

  describe("GET /api/places/:placeId/reviews - Retrieving Reviews", () => {
    it("18. successfully retrieves reviews for an existing place (200 OK)", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 1n,
          placeId: 1n,
          userId: 1n,
          rating: 5,
          body: "Go early, the guide is excellent.",
          createdAt: new Date("2026-11-02T10:00:00Z"),
          updatedAt: new Date("2026-11-02T10:00:00Z"),
          user: { id: 1n, name: "Abel" },
        },
      ] as any);

      const res = await request(app).get("/api/places/1/reviews");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: 1,
        placeId: 1,
        rating: 5,
        comment: "Go early, the guide is excellent.",
        user: { id: 1, name: "Abel" },
      });
    });

    it("19. returns an empty array when an existing place has no reviews", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 2n } as any);
      vi.mocked(prisma.review.findMany).mockResolvedValue([]);

      const res = await request(app).get("/api/places/2/reviews");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("20. returns 404 when place does not exist for GET /reviews", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue(null);

      const res = await request(app).get("/api/places/999/reviews");

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Place not found/i);
    });

    it("21. verifies that reviews are ordered newest first (createdAt descending)", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 2n,
          placeId: 1n,
          userId: 2n,
          rating: 4,
          body: "Newer review",
          createdAt: new Date("2026-11-02T12:00:00Z"),
          updatedAt: new Date("2026-11-02T12:00:00Z"),
          user: { id: 2n, name: "Liya" },
        },
        {
          id: 1n,
          placeId: 1n,
          userId: 1n,
          rating: 5,
          body: "Older review",
          createdAt: new Date("2026-11-01T08:00:00Z"),
          updatedAt: new Date("2026-11-01T08:00:00Z"),
          user: { id: 1n, name: "Abel" },
        },
      ] as any);

      const res = await request(app).get("/api/places/1/reviews");

      expect(res.status).toBe(200);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
      expect(res.body.data[0].id).toBe(2);
      expect(res.body.data[1].id).toBe(1);
    });

    it("22. verifies reviewer information is included without exposing unnecessary or sensitive user fields", async () => {
      vi.mocked(prisma.place.findUnique).mockResolvedValue({ id: 1n } as any);
      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 1n,
          placeId: 1n,
          userId: 1n,
          rating: 5,
          body: "Nice",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1n, name: "Sara" },
        },
      ] as any);

      const res = await request(app).get("/api/places/1/reviews");

      expect(res.status).toBe(200);
      const userObj = res.body.data[0].user;
      expect(userObj).toHaveProperty("id");
      expect(userObj).toHaveProperty("name");
      // Must not expose password, email, or internal tokens
      expect(userObj).not.toHaveProperty("password");
      expect(userObj).not.toHaveProperty("email");
    });
  });
});
