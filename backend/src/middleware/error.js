/**
 * @file error.js
 * @description Centralized error handler middleware.
 */

import { HttpError } from "../utils/error.js";

/**
 * Express error-handling middleware.
 *
 * Converts application and unexpected errors into a consistent HTTP response.
 * Known application errors extend HttpError and expose an HTTP status code,
 * while unexpected errors are treated as internal server errors.
 *
 * @param {Error} err Thrown error.
 * @param {Object} _req Express request object.
 * @param {Object} res Express response object.
 * @param {Function} _next Express next middleware function.
 */
export function errorHandler(err, _req, res, _next) {
  // Distinguish between application-defined HTTP errors and unexpected errors
  const isHttp = err instanceof HttpError;
  const statusCode = isHttp ? err.statusCode : 500;
  const message = isHttp ? err.message : "Internal Server Error";

  // Base error response payload
  const payload = { error: message };

  // Attach additional error details for known application errors
  if (isHttp && err.details) {
    payload.details = err.details;
  }

  // Include stack trace only in non-production environments
  if (!isHttp && (process.env.NODE_ENV ?? "development") !== "production") {
    payload.stack = String(err?.stack ?? "");
  }

  res.status(statusCode).json(payload);
}
