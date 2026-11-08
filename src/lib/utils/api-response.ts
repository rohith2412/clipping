import { NextResponse } from "next/server";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status }
  );
}

export function unauthorized(message = "Unauthorized") {
  return error(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return error(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found") {
  return error(message, 404, "NOT_FOUND");
}

export function validationError(details: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error: { message: "Validation failed", code: "VALIDATION_ERROR", details },
    },
    { status: 400 }
  );
}

export function rateLimited(message = "Rate limit exceeded") {
  return error(message, 429, "RATE_LIMITED");
}
