import type { Request, Response, NextFunction } from "express";
import { getUsers } from "./users.service.js";

/**
 * Handles GET /api/users
 * Returns list of travellers available for "acting as".
 */
export async function getUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

