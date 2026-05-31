/**
 * @file asyncHandler.js
 * @description Helper to wrap async Express handlers and forward errors to next().
 */

/**
 * Wraps an async Express route handler to ensure that
 * rejected promises are correctly forwarded to the
 * centralized error handling middleware.
 *
 * This avoids the need for repetitive try/catch blocks
 * in every async route definition.
 *
 * @param {Function} handler Async Express route handler.
 * @returns {Function} Wrapped handler compatible with Express.
 */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
