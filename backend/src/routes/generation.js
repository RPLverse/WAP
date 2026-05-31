/**
 * @file generation.js
 * @description Automatic round-robin match generation for tournaments.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as generationService from "../services/generationService.js";

// Router handling automatic match generation for tournaments
export const generationRouter = express.Router();

// Generate a round-robin match schedule for a tournament (creator only)
generationRouter.post(
  "/tournaments/:id/matches/generate",
  requireAuth,
  asyncHandler(async (req, res) => {

    // Delegate schedule generation logic to the service layer
    const result = await generationService.generateMatches(req.user, req.params.id);
    res.status(201).json(result);
  })
);
