/**
 * @file authService.js
 * @description
 * Authentication domain logic.
 *
 * This module is responsible for:
 * - user registration (signup)
 * - user authentication (signin)
 * - password hashing and verification
 * - JWT generation
 *
 * It does NOT handle HTTP requests directly and
 * does not depend on Express.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { config } from "../config.js";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError
} from "../utils/error.js";

/**
 * Registers a new user.
 *
 * The function:
 * -  Validates required input fields
 * -  Ensures username uniqueness
 * -  Hashes the password using bcrypt
 * -  Persists the user in the database
 *
 * Plain-text passwords are never stored.
 *
 * @param {Object} payload User registration data
 * @returns {Promise<{id:string,username:string,name:string,surname:string}>}
 */
export async function signup(payload) {
  const { username, password, name, surname } = payload;

  // Validate required input fields
  if (!username || !password || !name || !surname) {
    throw new ValidationError("Missing required fields", {
      required: ["username", "password", "name", "surname"]
    });
  }

  // Enforce unique username constraint
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    throw new ConflictError("Username already exists");
  }

  // Hash the password before storing it
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    passwordHash,
    name,
    surname
  });

  // Return a public representation (no password hash)
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    surname: user.surname
  };
}

/**
 * Authenticates a user and returns a signed JWT.
 *
 * The function:
 * - Validates credentials presence
 * - Loads the user by username
 * - Compares the provided password with the stored hash
 * - Generates a signed JWT containing the user identity
 *
 * The token is later used by the client to access
 * protected endpoints.
 *
 * @param {Object} payload User credentials
 * @returns {Promise<{token:string}>}
 */
export async function signin(payload) {
  const { username, password } = payload;

  // Validate credentials presence
  if (!username || !password) {
    throw new ValidationError("Missing credentials", {
      required: ["username", "password"]
    });
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Compare plain-text password with stored hash
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError("Invalid credentials");
  }

  /**
   * JWT payload:
   * - id: unique user identifier
   * - username: human-readable identity
   *
   * The token is signed using a server-side secret
   * and has a limited lifetime.
   */
  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

  return { token };
}
