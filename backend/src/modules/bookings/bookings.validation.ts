import { z } from "zod";
import { AppError } from "../../utils/AppError.js";

const bookingBodySchema = z.object({
  seats: z
    .number({ error: "Seats is required" })
    .int("Seats must be an integer")
    .min(1, "Seats must be a positive integer"),
});

export function validateSlotId(param: unknown): number {
  const parsed = Number(param);
  if (!param || !Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("Invalid tour slot ID: must be a positive integer", 400);
  }
  return parsed;
}

export function validateBookingBody(body: unknown): { seats: number } {
  const result = bookingBodySchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(message, 400);
  }

  return result.data;
}

