/**
 * @file players.js
 * @description Player management routes for teams.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as playerService from "../services/playerService.js";

// Router handling player-related operations within teams
export const playersRouter = express.Router();

// List all players belonging to a specific team
playersRouter.get(
  "/teams/:id/players",
  asyncHandler(async (req, res) => {
    const players = await playerService.listPlayers(req.params.id);
    res.json(players);
  })
);

// Add a new player to a team (authentication required)
playersRouter.post(
  "/teams/:id/players",
  requireAuth,
  asyncHandler(async (req, res) => {
    const player = await playerService.addPlayer(req.user, req.params.id, req.body);
    res.status(201).json(player);
  })
);
