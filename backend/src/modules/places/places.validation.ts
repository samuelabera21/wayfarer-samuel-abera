import { z } from "zod";
import { AppError } from "../../utils/AppError.js";
import type { GetPlacesQuery } from "./places.types.js";

const getPlacesQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, "Category cannot be empty")
    .max(50, "Category cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s_-]+$/, "Category contains invalid characters")
    .optional(),
  sort: z
    .literal("top-rated", {
      error: "Invalid sort parameter. Supported values: 'top-rated'",
    })
    .optional(),
});

export function validateGetPlacesQuery(query: unknown): GetPlacesQuery {
  const result = getPlacesQuerySchema.safeParse(query);

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(message, 400);
  }

  return result.data;
}
