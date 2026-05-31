/**
 * @file standings.js
 * @description Tournament standings computed dynamically from match results.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as standingsService from "../services/standingsService.js";

// Router handling computed tournament standings
export const standingsRouter = express.Router();

// Retrieve current standings for a tournament (computed from match results)
standingsRouter.get(
  "/tournaments/:id/standings",
  asyncHandler(async (req, res) => {
    const standings = await standingsService.getStandings(req.params.id);
    res.json(standings);
  })
);
