/**
 * @file sequelize.js
 * @description Sequelize initialization (PostgreSQL).
 *
 * Sequelize is an Object-Relational Mapping (ORM) library for Node.js.
 * It provides an abstraction layer over SQL databases, allowing
 * database tables to be represented as JavaScript models and
 * database queries to be expressed using a higher-level API.
 */

import { Sequelize } from "sequelize";
import { config } from "./config.js";

/**
 * Shared Sequelize instance.
 *
 * The database schema is created by the SQL init script (db/001_init.sql).
 */
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  retry: {
    max: 5,
    match: [/ECONNREFUSED/],
  },
});

/**
 * Ensures that the database connection is available.
 * This function is called during application startup.
 *
 * @returns {Promise<void>}
 * @throws {Error} If the database connection cannot be established.
 */
export async function initDatabaseConnection() {
  const maxRetries = 10;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log("Database connection established");
      return;
    } catch (err) {
      console.log(
        `Database not ready (attempt ${attempt}/${maxRetries}), retrying...`
      );
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  throw new Error("Unable to connect to the database after multiple attempts");
}
