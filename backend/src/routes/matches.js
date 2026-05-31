/**
 * @file matches.js
 * @description Match retrieval and result insertion routes.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as matchService from "../services/matchService.js";

// Router handling match-related endpoints
export const matchesRouter = express.Router();

// List all matches belonging to a specific tournament
matchesRouter.get(
  "/tournaments/:id/matches",
  asyncHandler(async (req, res) => {
    const matches = await matchService.listTournamentMatches(req.params.id);
    res.json(matches);
  })
);

// Retrieve details of a single match
matchesRouter.get(
  "/matches/:id",
  asyncHandler(async (req, res) => {
    const match = await matchService.getMatchById(req.params.id);
    res.json(match);
  })
);

// Insert or update the result of a match (creator only)
matchesRouter.put(
  "/matches/:id/result",
  requireAuth,
  asyncHandler(async (req, res) => {
    const match = await matchService.setMatchResult(req.user, req.params.id, req.body);
    res.json(match);
  })
);
