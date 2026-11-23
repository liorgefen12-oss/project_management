import type { ApiErrorBody } from "./types";
import { useGlobalStore } from "../store/useGlobalStore";
import { ApiError } from "./apiErrorClass";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  //extra request settings like http method, body...
  //default is method=GET, body=none
): Promise<T> {
  const res = await fetch(`http://localhost:3000${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 401) {
    //unauthenticated
    useGlobalStore.getState().clearUser(); //log out if not already logged out
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
