/**
 * @file userService.js
 * @description User retrieval and search domain logic.
 */

import { Op } from "sequelize";
import { User, Tournament } from "../models/index.js";
import { NotFoundError } from "../utils/error.js";

/**
 * Lists users, optionally filtered by a search query.
 *
 * The search is case-insensitive and matches username, name or surname.
 *
 * @param {Object} params Optional search parameters.
 * @returns {Promise<Array<any>>}
 */
export async function listUsers(params = {}) {
  const q = (params.q ?? "").trim();

  // Build optional case-insensitive search condition
  const where = q
    ? {
        [Op.or]: [
          { username: { [Op.iLike]: `%${q}%` } },
          { name: { [Op.iLike]: `%${q}%` } },
          { surname: { [Op.iLike]: `%${q}%` } }
        ]
      }
    : undefined;

  // Return only public user information
  return User.findAll({
    where,
    attributes: ["id", "username", "name", "surname"],
    order: [["username", "ASC"]]
  });
}

/**
 * Returns a user by id, including tournaments created by the user.
 *
 * @param {string} userId User identifier.
 * @returns {Promise<any>}
 */
export async function getUserById(userId) {
  // Load user profile together with tournaments they created
  const user = await User.findByPk(userId, {
    attributes: ["id", "username", "name", "surname"],
    include: [
      {
        model: Tournament,
        as: "createdTournaments",
        attributes: ["id", "name", "sport", "maxTeams", "startDate"]
      }
    ]
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
}

/**
 * Returns the authenticated user's profile.
 *
 * This method always uses the authenticated user identifier
 * and never exposes sensitive information.
 *
 * @param {Object} user Authenticated user context.
 * @returns {Promise<any>}
 */
export async function getWhoAmI(user) {
  const me = await User.findByPk(user.id, {
    attributes: ["id", "username", "name", "surname"]
  });

  if (!me) throw new NotFoundError("User not found");
  return me;
}
