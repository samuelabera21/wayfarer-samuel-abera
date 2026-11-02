import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

/**
 * Global Express error handling middleware.
 * Ensures operational AppErrors return meaningful client error codes and messages,
 * while unexpected errors are masked to prevent leaking database internals or stack traces.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Log unhandled server error for observability
  console.error("Unhandled internal error:", err);

  // Generic 500 error response without exposing internals
  res.status(500).json({
    error: "Internal Server Error",
    message: "An internal server error occurred",
    statusCode: 500,
  });
}

