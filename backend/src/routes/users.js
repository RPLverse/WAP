/**
 * @file users.js
 * @description User retrieval and search routes.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/userService.js";

// Router handling read-only user-related endpoints
export const usersRouter = express.Router();

// List users, optionally filtered by a search query
usersRouter.get(
  "/users",
  asyncHandler(async (req, res) => {

    // Optional query parameter 'q' is used for text-based search
    const users = await userService.listUsers({ q: req.query.q });
    res.json(users);
  })
);

// Retrieve details of a specific user by id
usersRouter.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  })
);
