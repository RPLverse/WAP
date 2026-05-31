/**
 * @file matchService.js
 * @description Match retrieval and result insertion domain logic.
 */

import { Match, Team, Tournament } from "../models/index.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Lists matches of a tournament.
 *
 * @param {string} tournamentId Tournament identifier.
 * @returns {Promise<Array<any>>}
 */
export async function listTournamentMatches(tournamentId) {
  // Ensure the tournament exists before listing its matches
  const tournament = await Tournament.findByPk(tournamentId);
  if (!tournament) throw new NotFoundError("Tournament not found");

  // Retrieve matches with related teams, ordered by match time
  return Match.findAll({
    where: { tournamentId },
    include: [
      { model: Team, as: "homeTeam" },
      { model: Team, as: "awayTeam" }
    ],
    order: [["matchTime", "ASC"]]
  });
}

/**
 * Gets a match by id.
 *
 * @param {string} matchId Match identifier.
 * @returns {Promise<any>}
 */
export async function getMatchById(matchId) {
  // Load match together with its participating teams
  const match = await Match.findByPk(matchId, {
    include: [
      { model: Team, as: "homeTeam" },
      { model: Team, as: "awayTeam" }
    ]
  });

  if (!match) throw new NotFoundError("Match not found");
  return match;
}

/**
 * Inserts or updates a match result.
 * Only the tournament creator can insert results, and only after the match time.
 *
 * @param {Object} user Authenticated user.
 * @param {string} matchId Match identifier.
 * @param {Object} payload Result payload.
 * @returns {Promise<any>}
 */
export async function setMatchResult(user, matchId, payload) {
  // Load match together with its tournament to check authorization
  const match = await Match.findByPk(matchId, {
    include: [
      {
        model: Tournament,
        as: "tournament",
        attributes: ["id", "creatorId"]
      }
    ]
  });

  if (!match) throw new NotFoundError("Match not found");

  // Only the tournament creator can insert or update match results
  if (match.tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the tournament creator can insert match results");
  }

  // Prevent inserting results before the match has been played
  if (new Date(match.matchTime) > new Date()) {
    throw new ValidationError("Results can only be inserted after the match time");
  }

  // Validate score values
  const homeScore = Number(payload.homeScore);
  const awayScore = Number(payload.awayScore);

  if (
    !Number.isInteger(homeScore) ||
    homeScore < 0 ||
    !Number.isInteger(awayScore) ||
    awayScore < 0
  ) {
    throw new ValidationError("Scores must be non-negative integers");
  }

  // Persist match result
  match.homeScore = homeScore;
  match.awayScore = awayScore;
  await match.save();

  return match;
}
