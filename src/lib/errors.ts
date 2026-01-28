// src/lib/errors.ts

/**
 * Base error class for application-specific errors.
 * All custom errors extend this class for consistent error handling.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a requested resource is not found.
 * Typically results in a 404 HTTP status code.
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code?: string) {
    super(message, 404, code);
  }
}

/**
 * Error thrown when input validation fails.
 * Typically results in a 400 HTTP status code.
 */
export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    public readonly details?: Record<string, string[] | string>,
    code?: string
  ) {
    super(message, 400, code);
  }
}

/**
 * Error thrown when a business rule is violated.
 * Typically results in a 422 HTTP status code.
 */
export class BusinessError extends AppError {
  constructor(message = "Business rule violation", code?: string) {
    super(message, 422, code);
  }
}
