import type { ApiErrorBody } from "./types";
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
