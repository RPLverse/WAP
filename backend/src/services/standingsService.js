/**
 * @file standingsService.js
 * @description Tournament standings domain logic (computed from match results).
 */

import { Op } from "sequelize";
import { Match, Team, Tournament } from "../models/index.js";
import { computeStandings } from "./standings.js";
import { NotFoundError } from "../utils/error.js";

/**
 * Computes standings for a tournament.
 *
 * @param {string} tournamentId Tournament identifier.
 * @returns {Promise<Array<any>>}
 */
export async function getStandings(tournamentId) {
  // Ensure the tournament exists
  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) throw new NotFoundError("Tournament not found");

  // Load all teams participating in the tournament
  const teams = await Team.findAll({
    where: { tournamentId }
  });

  // Load only matches with recorded results
  const matches = await Match.findAll({
    where: {
      tournamentId,
      homeScore: { [Op.ne]: null },
      awayScore: { [Op.ne]: null }
    }
  });

  // Delegate standings computation to pure domain logic
  return computeStandings(tournament.sport, teams, matches);
}
