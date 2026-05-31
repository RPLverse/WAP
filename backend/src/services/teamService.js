/**
 * @file teamService.js
 * @description Team management domain logic.
 */

import { Team, Tournament } from "../models/index.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Lists teams of a tournament.
 *
 * @param {string} tournamentId Tournament identifier.
 * @returns {Promise<Array<any>>}
 */
export async function listTeams(tournamentId) {
  // Load tournament together with its teams
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [{ model: Team, as: "teams" }]
  });

  if (!tournament) throw new NotFoundError("Tournament not found");
  return tournament.teams;
}

/**
 * Adds a team to a tournament.
 * Only the tournament creator can add teams.
 *
 * @param {Object} user Authenticated user.
 * @param {string} tournamentId Tournament identifier.
 * @param {Object} payload Team data.
 * @returns {Promise<any>}
 */
export async function addTeam(user, tournamentId, payload) {
  // Load tournament and existing teams to enforce domain rules
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [{ model: Team, as: "teams" }]
  });

  if (!tournament) throw new NotFoundError("Tournament not found");

  // Only the tournament creator is allowed to manage teams
  if (tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the creator can add teams");
  }

  // Validate team name
  if (!payload.name) {
    throw new ValidationError("Team name is required");
  }

  // Enforce maximum number of teams at application level
  if (tournament.teams.length >= tournament.maxTeams) {
    throw new ValidationError("Tournament already reached maxTeams");
  }

  try {
    // Team name uniqueness within a tournament is enforced at database level
    return await Team.create({
      name: payload.name,
      tournamentId: tournament.id
    });
  } catch {
    throw new ConflictError("Team name already exists in this tournament");
  }
}
