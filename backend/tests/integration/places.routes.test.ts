import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

// Mock the Prisma client to isolate database access
vi.mock("../../src/config/prisma.js", () => {
  return {
    prisma: {
      place: {
        findMany: vi.fn(),
      },
      review: {
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
    },
  };
});

describe("GET /api/places - Integration Tests", () => {
  const mockPlaces = [
    {
      id: 1n,
      name: "Brand-new Café",
      category: "Food",
      description: "A newly opened cozy coffee house.",
      openingHours: "07:00–20:00",
      imageUrl: "https://example.com/cafe.jpg",
    },
    {
      id: 2n,
      name: "National Museum",
      category: "History",
      description: "A renowned historical museum.",
      openingHours: "08:30–17:30",
      imageUrl: "https://example.com/museum.jpg",
    },
    {
      id: 3n,
      name: "Silent Forest",
      category: "Nature",
      description: "A quiet walking trail with no reviews yet.",
      openingHours: "06:00–18:00",
      imageUrl: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: C = 4.0
    vi.mocked(prisma.review.aggregate).mockResolvedValue({
      _avg: { rating: 4.0 },
      _count: { rating: 313, _all: 313 },
      _min: { rating: 1 },
      _max: { rating: 5 },
      _sum: { rating: 1252 },
    } as any);

    // Place 1: v=1, avg=5.0 -> W = (1/6)*5 + (5/6)*4 = 4.17
    // Place 2: v=312, avg=4.7 -> W = (312/317)*4.7 + (5/317)*4 = 4.69
    // Place 3: no reviews -> v=0, avg=null -> W = 0
    vi.mocked(prisma.review.groupBy).mockResolvedValue([
      {
        placeId: 1n,
        _avg: { rating: 5.0 },
        _count: { rating: 1 },
      },
      {
        placeId: 2n,
        _avg: { rating: 4.7 },
        _count: { rating: 312 },
      },
    ] as any);
  });

  it("successfully retrieves places with all required fields and correct types", async () => {
    vi.mocked(prisma.place.findMany).mockResolvedValue(mockPlaces as any);

    const res = await request(app).get("/api/places");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);

    const firstPlace = res.body[0];
    expect(firstPlace).toMatchObject({
      id: 1,
      name: "Brand-new Café",
      category: "Food",
      description: "A newly opened cozy coffee house.",
      openingHours: "07:00–20:00",
      imageUrl: "https://example.com/cafe.jpg",
      averageRating: 5.0,
      reviewCount: 1,
      weightedRating: 4.17,
    });
    expect(typeof firstPlace.id).toBe("number");
    expect(typeof firstPlace.weightedRating).toBe("number");
    expect(firstPlace.imageUrl).toBe("https://example.com/cafe.jpg");

    // Check place with no reviews
    const unreviewedPlace = res.body[2];
    expect(unreviewedPlace).toMatchObject({
      id: 3,
      name: "Silent Forest",
      category: "Nature",
      imageUrl: null,
      averageRating: null,
      reviewCount: 0,
      weightedRating: 0,
    });
    expect(unreviewedPlace.imageUrl).toBeNull();
  });

  it("filters places by category", async () => {
    const historyPlaces = [mockPlaces[1]];
    vi.mocked(prisma.place.findMany).mockResolvedValue(historyPlaces as any);

    const res = await request(app).get("/api/places?category=History");

    expect(res.status).toBe(200);
    expect(prisma.place.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: "History" },
      })
    );
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe("History");
  });

  it("sorts places by top-rated, ensuring established place outranks single-review 5-star place", async () => {
    vi.mocked(prisma.place.findMany).mockResolvedValue(mockPlaces as any);

    const res = await request(app).get("/api/places?sort=top-rated");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    // Order must be: Place 2 (W=4.69) -> Place 1 (W=4.17) -> Place 3 (W=0)
    expect(res.body[0].id).toBe(2);
    expect(res.body[0].name).toBe("National Museum");
    expect(res.body[0].weightedRating).toBe(4.69);

    expect(res.body[1].id).toBe(1);
    expect(res.body[1].name).toBe("Brand-new Café");
    expect(res.body[1].weightedRating).toBe(4.17);

    expect(res.body[2].id).toBe(3);
    expect(res.body[2].name).toBe("Silent Forest");
    expect(res.body[2].weightedRating).toBe(0);
  });

  it("combines category filtering and top-rated sorting", async () => {
    const multiFood = [
      mockPlaces[0],
      {
        id: 4n,
        name: "Ethio Diner",
        category: "Food",
        description: "Popular local food diner.",
        openingHours: "08:00–22:00",
      },
    ];

    vi.mocked(prisma.place.findMany).mockResolvedValue(multiFood as any);
    vi.mocked(prisma.review.groupBy).mockResolvedValue([
      { placeId: 1n, _avg: { rating: 5.0 }, _count: { rating: 1 } },
      { placeId: 4n, _avg: { rating: 4.8 }, _count: { rating: 25 } },
    ] as any);

    const res = await request(app).get(
      "/api/places?category=Food&sort=top-rated"
    );

    expect(res.status).toBe(200);
    expect(prisma.place.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: "Food" },
      })
    );
    expect(res.body).toHaveLength(2);
    // Ethio Diner (v=25, R=4.8): (25/30)*4.8 + (5/30)*4.0 = 4.0 + 0.67 = 4.67
    // Brand-new Café (v=1, R=5.0): (1/6)*5.0 + (5/6)*4.0 = 4.17
    // Ethio Diner must be first
    expect(res.body[0].name).toBe("Ethio Diner");
    expect(res.body[1].name).toBe("Brand-new Café");
  });

  it("returns an empty array when a category has no matching places", async () => {
    vi.mocked(prisma.place.findMany).mockResolvedValue([]);

    const res = await request(app).get("/api/places?category=NonExistent");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    // Ensure it didn't execute review aggregation if no places were found
    expect(prisma.review.groupBy).not.toHaveBeenCalled();
  });

  it("rejects invalid or unsupported sort parameter with 400", async () => {
    const res = await request(app).get("/api/places?sort=random_sort");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.statusCode).toBe(400);
  });

  it("rejects empty category parameter with 400", async () => {
    const res = await request(app).get("/api/places?category=");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.statusCode).toBe(400);
  });

  it("rejects category containing invalid characters with 400", async () => {
    const res = await request(app).get(
      "/api/places?category=<script>alert(1)</script>"
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.statusCode).toBe(400);
  });
});

