/**
 * @file error.js
 * @description Custom HTTP error classes used across the application.
 *
 * These errors are thrown at service or middleware level and are
 * automatically translated into HTTP responses by the centralized
 * error handling middleware.
 */

/**
 * Base HTTP error class.
 * All custom application errors extend this class.
 */
export class HttpError extends Error {
  /**
   * @param {number} statusCode HTTP status code.
   * @param {string} message Error message.
   * @param {Object} [details] Optional additional error details.
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 400 Bad Request.
 * Used for malformed or invalid client requests.
 */
export class BadRequestError extends HttpError {
  constructor(message = "Bad Request", details) {
    super(400, message, details);
  }
}

/**
 * 401 Unauthorized.
 * Used when authentication is required or invalid.
 */
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

/**
 * 403 Forbidden.
 * Used when the authenticated user lacks sufficient permissions.
 */
export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

/**
 * 404 Not Found.
 * Used when a requested resource does not exist.
 */
export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

/**
 * 409 Conflict.
 * Typically used for uniqueness or state conflicts.
 */
export class ConflictError extends HttpError {
  constructor(message = "Conflict", details) {
    super(409, message, details);
  }
}

/**
 * 422 Unprocessable Entity.
 * Used for semantic validation errors on request data.
 */
export class ValidationError extends HttpError {
  constructor(message = "Validation Error", details) {
    super(422, message, details);
  }
}
