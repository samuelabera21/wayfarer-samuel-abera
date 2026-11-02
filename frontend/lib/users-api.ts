import { apiFetch } from "./api";
import type { User } from "./types";

/**
 * Retrieves the seeded travellers from the Express API.
 */
export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

