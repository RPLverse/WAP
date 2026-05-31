/**
 * @file whoami.js
 * @description Returns the authenticated user profile.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as userService from "../services/userService.js";

// Router handling authenticated user identity endpoint
export const whoamiRouter = express.Router();

// Return the profile of the currently authenticated user
whoamiRouter.get(
  "/whoami",
  requireAuth,
  asyncHandler(async (req, res) => {
    const me = await userService.getWhoAmI(req.user);
    res.json(me);
  })
);
