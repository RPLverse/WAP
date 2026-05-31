/**
 * @file models/index.js
 * @description
 * Sequelize models initialization and association definitions.
 *
 * This file defines the data model of the application and the relationships
 * between entities. It does not contain business logic, which is delegated
 * to the service layer.
 */

import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

/**
 * User model.
 *
 * Represents an authenticated user of the system.
 * Users are the main actors of the application and can:
 * - create tournaments
 * - book sports fields
 *
 * Passwords are never stored in plain text; only a hashed version is persisted.
 */
export const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    username: { type: DataTypes.TEXT, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: "password_hash" },
    name: { type: DataTypes.TEXT, allowNull: false },
    surname: { type: DataTypes.TEXT, allowNull: false }
  },
  {
    tableName: "users",
    timestamps: false,
    underscored: true
  }
);

/**
 * Field model.
 *
 * Represents a physical sports field that can be booked by users.
 * Fields are independent from tournaments and can be reused
 * across different bookings.
 */
export const Field = sequelize.define(
  "Field",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false },
    sport: {
      type: DataTypes.ENUM("football", "volleyball", "basketball"),
      allowNull: false
    },
    address: { type: DataTypes.TEXT, allowNull: false }
  },
  {
    tableName: "fields",
    timestamps: false,
    underscored: true
  }
);

/**
 * FieldBooking model.
 *
 * Represents a reservation of a sports field by a user
 * for a specific time interval.
 *
 * A booking belongs to exactly one user and one field,
 * but users and fields can have multiple bookings over time.
 */
export const FieldBooking = sequelize.define(
  "FieldBooking",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    fieldId: { type: DataTypes.UUID, allowNull: false, field: "field_id" },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    startTime: { type: DataTypes.DATE, allowNull: false, field: "start_time" },
    endTime: { type: DataTypes.DATE, allowNull: false, field: "end_time" }
  },
  {
    tableName: "field_bookings",
    timestamps: false,
    underscored: true
  }
);

/**
 * Tournament model.
 *
 * Represents a sports tournament created by a user.
 * The tournament creator is the owner of the tournament
 * and has special privileges (update, delete).
 *
 * The tournament status is not persisted in the database
 * but computed dynamically based on match results.
 */
export const Tournament = sequelize.define(
  "Tournament",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.TEXT, allowNull: false },
    sport: {
      type: DataTypes.ENUM("football", "volleyball", "basketball"),
      allowNull: false
    },
    maxTeams: { type: DataTypes.INTEGER, allowNull: false, field: "max_teams" },
    startDate: { type: DataTypes.DATEONLY, allowNull: false, field: "start_date" },
    creatorId: { type: DataTypes.UUID, allowNull: false, field: "creator_id" }
  },
  {
    tableName: "tournaments",
    timestamps: false,
    underscored: true
  }
);

/**
 * Team model.
 *
 * Represents a team participating in a tournament.
 * Teams only exist within the context of a tournament
 * and have no standalone meaning.
 */
export const Team = sequelize.define(
  "Team",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tournamentId: { type: DataTypes.UUID, allowNull: false, field: "tournament_id" },
    name: { type: DataTypes.TEXT, allowNull: false }
  },
  {
    tableName: "teams",
    timestamps: false,
    underscored: true
  }
);

/**
 * Player model.
 *
 * Represents a player belonging to a team.
 * Players are tightly coupled to teams and
 * cannot exist independently.
 */
export const Player = sequelize.define(
  "Player",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    teamId: { type: DataTypes.UUID, allowNull: false, field: "team_id" },
    name: { type: DataTypes.TEXT, allowNull: false },
    surname: { type: DataTypes.TEXT, allowNull: false },
    jerseyNo: { type: DataTypes.INTEGER, allowNull: true, field: "jersey_no" }
  },
  {
    tableName: "players",
    timestamps: false,
    underscored: true
  }
);

/**
 * Match model.
 *
 * Represents a scheduled match between two teams
 * belonging to the same tournament.
 *
 * Match results are optional and may be recorded
 * after the match has been played.
 */
export const Match = sequelize.define(
  "Match",
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tournamentId: { type: DataTypes.UUID, allowNull: false, field: "tournament_id" },
    homeTeamId: { type: DataTypes.UUID, allowNull: false, field: "home_team_id" },
    awayTeamId: { type: DataTypes.UUID, allowNull: false, field: "away_team_id" },
    matchTime: { type: DataTypes.DATE, allowNull: false, field: "match_time" },
    homeScore: { type: DataTypes.INTEGER, allowNull: true, field: "home_score" },
    awayScore: { type: DataTypes.INTEGER, allowNull: true, field: "away_score" }
  },
  {
    tableName: "matches",
    timestamps: false,
    underscored: true
  }
);

// ------------------------------------------------------------
// Model associations
// ------------------------------------------------------------

/**
 * One-to-many relationship between users and tournaments.
 *
 * A user can create multiple tournaments,
 * but each tournament has exactly one creator.
 */
User.hasMany(Tournament, { foreignKey: "creatorId", as: "createdTournaments" });
Tournament.belongsTo(User, { foreignKey: "creatorId", as: "creator" });

/**
 * One-to-many relationship between tournaments and teams.
 *
 * A tournament is composed of multiple teams,
 * but each team belongs to exactly one tournament.
 */
Tournament.hasMany(Team, { foreignKey: "tournamentId", as: "teams" });
Team.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });

/**
 * One-to-many relationship between teams and players.
 *
 * A team can have multiple players,
 * but each player belongs to a single team.
 */
Team.hasMany(Player, { foreignKey: "teamId", as: "players" });
Player.belongsTo(Team, { foreignKey: "teamId", as: "team" });

/**
 * One-to-many relationship between tournaments and matches.
 *
 * A tournament consists of multiple matches,
 * but each match belongs to one tournament.
 */
Tournament.hasMany(Match, { foreignKey: "tournamentId", as: "matches" });
Match.belongsTo(Tournament, { foreignKey: "tournamentId", as: "tournament" });

/**
 * Each match references two teams: home and away.
 */
Match.belongsTo(Team, { foreignKey: "homeTeamId", as: "homeTeam" });
Match.belongsTo(Team, { foreignKey: "awayTeamId", as: "awayTeam" });

/**
 * One-to-many relationships for field bookings.
 *
 * Users and fields can have multiple bookings over time,
 * but each booking refers to exactly one user and one field.
 */
Field.hasMany(FieldBooking, { foreignKey: "fieldId", as: "bookings" });
FieldBooking.belongsTo(Field, { foreignKey: "fieldId", as: "field" });

User.hasMany(FieldBooking, { foreignKey: "userId", as: "fieldBookings" });
FieldBooking.belongsTo(User, { foreignKey: "userId", as: "user" });

/**
 * Export all models for centralized access.
 */
export const models = {
  User,
  Field,
  FieldBooking,
  Tournament,
  Team,
  Player,
  Match
};
