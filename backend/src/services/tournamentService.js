/**
 * @file tournamentService.js
 * @description Tournament domain logic.
 *
 * This service layer encapsulates all business rules related to tournaments.
 * It is responsible for:
 * - creating and validating tournaments
 * - enforcing authorization rules (creator-only actions)
 * - managing tournament lifecycle constraints
 * - computing derived state (tournament status)
 *
 * This module contains no HTTP / Express logic.
 * Authentication is handled upstream via JWT middleware.
 * Authorization decisions are enforced here.
 */

import { Op } from "sequelize";
import { Match, Team, Tournament, User } from "../models/index.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Computes the current status of a tournament.
 *
 * A tournament is considered:
 * - "Active" if at least one match has no recorded result
 * - "Completed" if all matches have final scores
 *
 * The status is derived dynamically and NOT stored in the database,
 * preventing redundancy and consistency issues.
 *
 * @param {Array<Object>} matches Tournament matches
 * @returns {"Active"|"Completed"}
 */
function computeTournamentStatus(matches) {
  if (!matches || matches.length === 0) {
    return "Active";
  }

  const hasOpenMatch = matches.some(
    (m) => m.homeScore === null || m.awayScore === null
  );

  return hasOpenMatch ? "Active" : "Completed";
}

/**
 * Lists all tournaments.
 *
 * Includes:
 * - creator public profile
 * - minimal match data required to compute status
 *
 * @returns {Promise<Array<Object>>}
 */
export async function listTournaments(params = {}) {
  // Normalize optional query string and status filter received from the frontend.
  const q = (params.q ?? "").trim();
  const requestedStatus = (params.status ?? "all").toLowerCase();

  // Sequelize WHERE object built only when a free-text query is provided.
  const where = {};

  if (q) {
    // Tournament name is a TEXT column, so ILIKE can be used safely.
    const orConditions = [
      { name: { [Op.iLike]: `%${q}%` } }
    ];

    // Sport is a PostgreSQL ENUM, therefore we avoid ILIKE on it.
    // Instead, we map common partial/localized queries to exact enum values.
    const normalized = q.toLowerCase();

    if ("calcio".includes(normalized) || "football".includes(normalized)) {
      orConditions.push({ sport: "football" });
    }

    if (
      "volleyball".includes(normalized) ||
      "volley".includes(normalized) ||
      "pallavolo".includes(normalized)
    ) {
      orConditions.push({ sport: "volleyball" });
    }

    if (
      "basketball".includes(normalized) ||
      "basket".includes(normalized) ||
      "pallacanestro".includes(normalized)
    ) {
      orConditions.push({ sport: "basketball" });
    }

    where[Op.or] = orConditions;
  }

  const tournaments = await Tournament.findAll({
    where: q ? where : undefined,
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "username", "name", "surname"]
      },
      {
        model: Match,
        as: "matches",
        attributes: ["id", "homeScore", "awayScore"]
      }
    ],
    order: [["startDate", "DESC"]]
  });

  return tournaments
    .map((t) => {
      const obj = t.toJSON();
      obj.status = computeTournamentStatus(obj.matches);
      return obj;
    })
    .filter((t) => {
      if (!requestedStatus || requestedStatus === "all") return true;
      return t.status.toLowerCase() === requestedStatus;
    });
}

/**
 * Creates a new tournament.
 *
 * Business rules:
 * - all fields are mandatory
 * - the authenticated user becomes the creator
 *
 * @param {Object} user Authenticated user (from JWT)
 * @param {Object} payload Tournament creation data
 * @returns {Promise<Tournament>}
 */
export async function createTournament(user, payload) {
  const { name, sport, maxTeams, startDate } = payload;

  if (!name || !sport || !maxTeams || !startDate) {
    throw new ValidationError("Missing required fields", {
      required: ["name", "sport", "maxTeams", "startDate"]
    });
  }

  return Tournament.create({
    name,
    sport,
    maxTeams,
    startDate: new Date(startDate),
    creatorId: user.id
  });
}

/**
 * Retrieves a tournament by its identifier.
 *
 * Loads:
 * - creator information
 * - registered teams
 * - scheduled matches
 *
 * Tournament status is computed dynamically.
 *
 * @param {string} tournamentId Tournament identifier
 * @returns {Promise<Object>}
 */
export async function getTournamentById(tournamentId) {
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "username", "name", "surname"]
      },
      {
        model: Team,
        as: "teams"
      },
      {
        model: Match,
        as: "matches"
      }
    ]
  });

  if (!tournament) {
    throw new NotFoundError("Tournament not found");
  }

  const obj = tournament.toJSON();
  obj.status = computeTournamentStatus(obj.matches);
  return obj;
}

/**
 * Updates a tournament.
 *
 * Authorization:
 * - only the creator of the tournament can update it
 *
 * Business constraints:
 * - maxTeams must be a positive integer
 * - maxTeams cannot be lower than the number of existing teams
 *
 * @param {Object} user Authenticated user
 * @param {string} tournamentId Tournament identifier
 * @param {Object} payload Updated tournament data
 * @returns {Promise<Tournament>}
 */
export async function updateTournament(user, tournamentId, payload) {
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [{ model: Team, as: "teams", attributes: ["id"] }]
  });

  if (!tournament) {
    throw new NotFoundError("Tournament not found");
  }

  if (tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the creator can edit this tournament");
  }

  if (payload.maxTeams !== undefined) {
    const maxTeams = Number(payload.maxTeams);

    if (!Number.isFinite(maxTeams) || maxTeams <= 0) {
      throw new ValidationError("maxTeams must be a positive number");
    }

    if (maxTeams < tournament.teams.length) {
      throw new ValidationError(
        "maxTeams cannot be lower than already registered teams"
      );
    }

    tournament.maxTeams = maxTeams;
  }

  if (payload.name !== undefined) {
    tournament.name = payload.name;
  }

  if (payload.startDate !== undefined) {
    tournament.startDate = new Date(payload.startDate);
  }

  await tournament.save();
  return tournament;
}


/**
 * Deletes a tournament.
 *
 * Authorization:
 * - only the creator can delete the tournament
 *
 * Lifecycle constraints:
 * - deletion is NOT allowed once matches have been generated
 *
 * @param {Object} user Authenticated user
 * @param {string} tournamentId Tournament identifier
 * @returns {Promise<void>}
 */
export async function deleteTournament(user, tournamentId) {
  const tournament = await Tournament.findByPk(tournamentId, {
    include: [{ model: Match, as: "matches", attributes: ["id"] }]
  });

  if (!tournament) {
    throw new NotFoundError("Tournament not found");
  }

  if (tournament.creatorId !== user.id) {
    throw new ForbiddenError("Only the creator can delete this tournament");
  }

  if (tournament.matches.length > 0) {
    throw new ValidationError(
      "Cannot delete a tournament with generated matches"
    );
  }

  await tournament.destroy();
}
