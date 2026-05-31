/**
 * @file config.js
 * @description Application configuration loaded from environment variables.
 *
 * Environment-specific configuration is provided
 * via environment variables (ports, secrets, database connection string).
 */

/**
 * Reads an environment variable and ensures it is defined.
 *
 * @param {string} name Environment variable name.
 * @param {string} [fallback] Optional fallback value.
 * @returns {string} The resolved environment variable value.
 * @throws {Error} If the variable is missing and no fallback is provided.
 */
function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Centralized application configuration object
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET", "dev-secret-change-me"),
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
};
