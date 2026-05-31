/**
 * @file teams.js
 * @description Team management routes for tournaments.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as teamService from "../services/teamService.js";

// Router handling team-related operations within tournaments
export const teamsRouter = express.Router();

// List all teams registered in a tournament
teamsRouter.get(
  "/tournaments/:id/teams",
  asyncHandler(async (req, res) => {
    const teams = await teamService.listTeams(req.params.id);
    res.json(teams);
  })
);

// Register a new team in a tournament (creator only)
teamsRouter.post(
  "/tournaments/:id/teams",
  requireAuth,
  asyncHandler(async (req, res) => {
    const team = await teamService.addTeam(req.user, req.params.id, req.body);
    res.status(201).json(team);
  })
);
