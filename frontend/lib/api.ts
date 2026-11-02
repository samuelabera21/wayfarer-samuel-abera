/**
 * API client configuration and base fetch utilities for connecting
 * the Next.js frontend to the Express backend.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:4000";

export const ACTIVE_USER_STORAGE_KEY = "wayfarer_active_user_id";

export function getStoredActiveUserId(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function setStoredActiveUserId(userId: number | null): void {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(userId));
  } else {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  userId?: number | string | null;
}

/**
 * Base fetch wrapper for the Wayfarer Express API.
 * Automatically injects headers (Content-Type, X-User-Id) and normalizes errors.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { userId, headers: customHeaders, ...rest } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  // Determine effective user ID: explicit option wins, falls back to stored active user
  const effectiveUserId = userId !== undefined ? userId : getStoredActiveUserId();

  if (effectiveUserId) {
    headers["X-User-Id"] = String(effectiveUserId);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object" && "error" in data
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}
