import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/prisma.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: bigint;
        name: string;
      };
    }
  }
}

/**
 * Middleware to extract and validate the acting user from the X-User-Id request header.
 *
 * Rules:
 * - Missing header -> 400 Bad Request
 * - Invalid format (not a positive integer) -> 400 Bad Request
 * - User does not exist in database -> 404 Not Found
 * - Valid user -> attaches `req.currentUser`
 */
export async function currentUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const headerValue = req.headers["x-user-id"];

  if (!headerValue) {
    return next(new AppError("Missing X-User-Id header", 400));
  }

  const rawId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const parsedId = Number(rawId);

  if (!rawId || !Number.isInteger(parsedId) || parsedId <= 0) {
    return next(
      new AppError("Invalid X-User-Id header: must be a positive integer", 400)
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(parsedId) },
      select: { id: true, name: true },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

