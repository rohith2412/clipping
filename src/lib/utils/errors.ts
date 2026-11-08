export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class UsageLimitError extends AppError {
  public current: number;
  public limit: number;

  constructor(current: number, limit: number) {
    super("Monthly clip limit reached", 429, "USAGE_LIMIT_EXCEEDED");
    this.name = "UsageLimitError";
    this.current = current;
    this.limit = limit;
  }
}

export class ValidationError extends AppError {
  public details: Record<string, string[]>;

  constructor(details: Record<string, string[]>) {
    super("Validation failed", 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}
