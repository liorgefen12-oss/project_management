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

// Readable text for any error thrown by apiFetch (validation errors list every issue)
export function errorMessage(
  error: unknown,
  fallback = "Could not reach the server",
) {
  if (error instanceof ApiError) {
    return error.body.errorMessages?.join(", ") ?? error.body.message;
  }
  return fallback;
}
