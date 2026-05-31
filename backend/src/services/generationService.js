/**
 * @file generationService.js
 * @description Automatic match generation domain logic (single round-robin).
 */

import { sequelize } from "../sequelize.js";
import { Match, Team, Tournament } from "../models/index.js";
import { generateRoundRobin } from "./schedule.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Generates matches for a tournament (creator-only, only once).
 *
 * @param {Object} user Authenticated user.
 * @param {string} tournamentId Tournament identifier.
 * @returns {Promise<{generated:number}>}
 */
export async function generateMatches(user, tournamentId) {
  // Load tournament together with registered teams and existing matches
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [
      { model: Team, as: "teams", attributes: ["id"] },
      { model: Match, as: "matches", attributes: ["id"] }
    ]
  });

  // Validate tournament existence and authorization
  if (!tournament) throw new NotFoundError("Tournament not found");
  if (tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the tournament creator can generate matches");
  }

  // Enforce single generation and minimum team count
  if (tournament.matches.length > 0) {
    throw new ValidationError("Matches already generated");
  }
  if (tournament.teams.length < 2) {
    throw new ValidationError("At least two teams are required to generate matches");
  }

  // Extract team identifiers and generate round-robin pairings
  const teamIds = tournament.teams.map(t => t.id);
  const { rounds } = generateRoundRobin(teamIds);
  const pairs = rounds.flat();

  // Base date for scheduling matches (start date, fixed time)
  const base = new Date(tournament.startDate);
  base.setHours(18, 0, 0, 0);

  // Create all matches inside a single transaction to ensure consistency
  await sequelize.transaction(async (tx) => {
    for (let i = 0; i < pairs.length; i += 1) {

      // Schedule one match per day starting from the tournament start date
      const matchTime = new Date(base);
      matchTime.setDate(base.getDate() + i);

      const { homeTeamId, awayTeamId } = pairs[i];

      await Match.create(
        {
          tournamentId: tournament.id,
          homeTeamId,
          awayTeamId,
          matchTime,
          homeScore: null,
          awayScore: null
        },
        { transaction: tx }
      );
    }
  });

  return { generated: pairs.length };
}
