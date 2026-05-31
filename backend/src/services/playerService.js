/**
 * @file playerService.js
 * @description Player management domain logic.
 */

import { Player, Team, Tournament } from "../models/index.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Lists players of a team.
 *
 * @param {string} teamId Team identifier.
 * @returns {Promise<Array<any>>}
 */
export async function listPlayers(teamId) {
  // Load team together with its players
  const team = await Team.findByPk(teamId, {
    include: [{ model: Player, as: "players" }]
  });

  if (!team) throw new NotFoundError("Team not found");
  return team.players;
}

/**
 * Adds a player to a team.
 * Only the tournament creator is allowed to add players.
 *
 * @param {Object} user Authenticated user.
 * @param {string} teamId Team identifier.
 * @param {Object} payload Player data.
 * @returns {Promise<any>}
 */
export async function addPlayer(user, teamId, payload) {
  // Load team together with its tournament to check authorization
  const team = await Team.findByPk(teamId, {
    include: [
      {
        model: Tournament,
        as: "tournament",
        attributes: ["id", "creatorId"]
      }
    ]
  });

  if (!team) throw new NotFoundError("Team not found");

  // Only the tournament creator can manage team players
  if (team.tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the tournament creator can add players");
  }

  const { name, surname, jerseyNo } = payload;

  // Validate required player information
  if (!name || !surname) {
    throw new ValidationError("Missing required fields", {
      required: ["name", "surname"]
    });
  }

  // Validate optional jersey number
  if (jerseyNo !== undefined && jerseyNo !== null) {
    const n = Number(jerseyNo);
    if (!Number.isFinite(n) || n <= 0) {
      throw new ValidationError("jerseyNo must be a positive number");
    }
  }

  // Jersey number uniqueness (when provided) is enforced at database level
  return Player.create({
    teamId: team.id,
    name,
    surname,
    jerseyNo: jerseyNo ?? null
  });
}
