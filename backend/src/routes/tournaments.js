/**
 * @file tournaments.js
 * @description Tournament routes (CRUD operations).
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as tournamentService from "../services/tournamentService.js";

export const tournamentsRouter = express.Router();

// List tournaments
tournamentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await tournamentService.listTournaments(req.query));
  })
);

// Create tournament
tournamentsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const t = await tournamentService.createTournament(req.user, req.body);
    res.status(201).json(t);
  })
);

// Tournament details
tournamentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await tournamentService.getTournamentById(req.params.id));
  })
);

// Update tournament
tournamentsRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(
      await tournamentService.updateTournament(req.user, req.params.id, req.body)
    );
  })
);

// Delete tournament
tournamentsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await tournamentService.deleteTournament(req.user, req.params.id);
    res.status(204).send();
  })
);
