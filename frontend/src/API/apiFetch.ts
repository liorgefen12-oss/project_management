import type { ApiErrorBody } from "./types";
import { useGlobalStore } from "../store/useGlobalStore";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`http://localhost:3000${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 401) {
    useGlobalStore.getState().clearUser();
  }
  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ message: res.statusText }) as ApiErrorBody);
    throw new ApiError(res.status, body);
  }
  // 204 No Content (logout, project sign in/out) has no body to parse
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Readable text for any error thrown by apiFetch (validation errors list every issue)
export function errorMessage(error: unknown, fallback = "Could not reach the server") {
  if (error instanceof ApiError) {
    return error.body.errorMessages?.join(", ") ?? error.body.message;
  }
  return fallback;
}
