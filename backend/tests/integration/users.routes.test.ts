import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

vi.mock("../../src/config/prisma.js", () => {
  return {
    prisma: {
      user: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("GET /api/users - Integration Tests", () => {
  const mockUsers = [
    { id: 1n, name: "Samuel" },
    { id: 2n, name: "Fanos" },
    { id: 3n, name: "Nigus" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 OK with the list of seeded travellers", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    expect(res.body).toEqual([
      { id: 1, name: "Samuel" },
      { id: 2, name: "Fanos" },
      { id: 3, name: "Nigus" },
    ]);
  });
});

