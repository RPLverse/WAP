/**
 * @file app.js
 * @description Express application entrypoint.
 *
 * This file:
 * - initializes the database connection
 * - configures middleware
 * - registers all API routes
 * - starts the HTTP server
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config.js";
import { initDatabaseConnection } from "./sequelize.js";
import { errorHandler } from "./middleware/error.js";
import { NotFoundError } from "./utils/error.js";

import { authRouter } from "./routes/auth.js";
import { fieldsRouter } from "./routes/fields.js";
import { generationRouter } from "./routes/generation.js";
import { matchesRouter } from "./routes/matches.js";
import { playersRouter } from "./routes/players.js";
import { slotsRouter } from "./routes/slots.js";
import { standingsRouter } from "./routes/standings.js";
import { teamsRouter } from "./routes/teams.js";
import { tournamentsRouter } from "./routes/tournaments.js";
import { usersRouter } from "./routes/users.js";
import { whoamiRouter } from "./routes/whoami.js";

// Initialize the database connection before starting the HTTP server
await initDatabaseConnection();

const app = express();

// Disable Express ETag generation for API responses. Search/list endpoints
// are dynamic and should return a real JSON body on every request, not 304.
app.set("etag", false);

// The frontend is built by Vite into the public directory during the Docker build.
// Express serves those static files directly, so no separate Nginx/web-server
// container is needed.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../public");

// Enable JSON body parsing for incoming requests
app.use(express.json());

// API responses are dynamic. Disable browser/proxy caching so searches with
// different filters always receive the current JSON payload.
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Register API routes
app.use("/api", generationRouter);
app.use("/api", matchesRouter);
app.use("/api", playersRouter);
app.use("/api", slotsRouter);
app.use("/api", standingsRouter);
app.use("/api", teamsRouter);
app.use("/api", usersRouter);
app.use("/api", whoamiRouter);
app.use("/api/auth", authRouter);
app.use("/api/fields", fieldsRouter);
app.use("/api/tournaments", tournamentsRouter);

// Undefined API routes return JSON errors.
app.use("/api", (_req, _res, next) => next(new NotFoundError("Route not found")));

// Serve the compiled Vue application as static files.
app.use(express.static(frontendDistPath));

// Vue Router uses history mode, so browser refreshes on frontend routes
// must return index.html and let the client-side router handle the page.
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Centralized error handling middleware
app.use(errorHandler);

// Start the HTTP server
app.listen(config.port, "0.0.0.0", () => {
  console.log(`Backend listening on port ${config.port}`);
});
