/**
 * @file auth.js
 * @description
 * Authentication middleware based on JSON Web Tokens (JWT).
 *
 * This middleware protects routes that require an authenticated user.
 * It validates the JWT and attaches the authenticated user
 * to the request object.
 */

import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { config } from "../config.js";
import { UnauthorizedError } from "../utils/error.js";

/**
 * Middleware that enforces authentication.
 *
 * Expected Authorization header format:
 *   Authorization: Bearer <JWT>
 *
 * If the token is valid:
 * - the user is loaded from the database
 * - the user object is attached to req.user
 *
 * If the token is missing or invalid, the request
 * is rejected with an Unauthorized error.
 *
 * @param {Request} req Express request object
 * @param {Response} _res Express response object (unused)
 * @param {NextFunction} next Express next middleware function
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = header.substring("Bearer ".length);

    let payload;
    try {
      // Verify token signature and expiration.
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    /**
     * Load the authenticated user from the database.
     *
     * This extra lookup is important because a token may still exist in the
     * browser while the related user has been deleted from the database, for
     * example after recreating the Docker volume during development.
     */
    const user = await User.findByPk(payload.id);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Attach the authenticated user to the request for the next handlers.
    req.user = user;
    next();
  } catch (err) {
    // Express 4 does not automatically catch rejected promises in async
    // middleware. Forward the error to the centralized error handler instead
    // of letting Node terminate the process.
    next(err);
  }
}
