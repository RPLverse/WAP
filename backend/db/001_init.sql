-- ------------------------------------------------------------
-- Database initialization script
--
-- This script defines the relational database schema of the application.
-- It includes:
-- - domain types
-- - tables
-- - constraints
-- - relationships
--
-- The script is executed automatically by PostgreSQL
-- when the database container is started for the first time.
-- ------------------------------------------------------------

-- Enable pgcrypto extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Domain types
-- ------------------------------------------------------------

-- Enumerated type representing the supported sports.
-- This enforces data consistency at database level.
CREATE TYPE sport_type AS ENUM ('football', 'volleyball', 'basketball');

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------

-- Stores registered users.
-- Passwords are stored as secure hashes, never in plaintext.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL
);

-- ------------------------------------------------------------
-- Sports fields
-- ------------------------------------------------------------

-- Represents physical sports fields that can be booked by users.
CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport sport_type NOT NULL,
  address TEXT NOT NULL
);

-- ------------------------------------------------------------
-- Field bookings
-- ------------------------------------------------------------

-- Stores confirmed bookings for sports fields.
-- Time slots are validated at database level to prevent overlaps.
CREATE TABLE field_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id),
  user_id UUID REFERENCES users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Prevent overlapping bookings for the same field
  CONSTRAINT no_overlap UNIQUE (field_id, start_time, end_time),

  -- Ensure temporal consistency of bookings
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- ------------------------------------------------------------
-- Tournaments
-- ------------------------------------------------------------

-- Represents sports tournaments created by users.
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport sport_type NOT NULL,
  max_teams INT NOT NULL CHECK (max_teams >= 2),
  start_date DATE NOT NULL,

  -- User who created the tournament
  creator_id UUID REFERENCES users(id)
);

-- ------------------------------------------------------------
-- Teams
-- ------------------------------------------------------------

-- Teams participating in a tournament.
-- Team names must be unique within the same tournament.
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  name TEXT NOT NULL,
  UNIQUE (tournament_id, name)
);

-- ------------------------------------------------------------
-- Players
-- ------------------------------------------------------------

-- Players belonging to a team.
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  jersey_no INT,

  -- Jersey number, if provided, must be non-negative
  CONSTRAINT jersey_non_negative CHECK (jersey_no IS NULL OR jersey_no >= 0)
);

-- A jersey number (when provided) must be unique within the team.
-- This rule is enforced via a partial unique index.
CREATE UNIQUE INDEX players_unique_jersey_per_team
  ON players (team_id, jersey_no)
  WHERE jersey_no IS NOT NULL;

-- ------------------------------------------------------------
-- Matches
-- ------------------------------------------------------------

-- Matches scheduled within a tournament.
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  match_time TIMESTAMPTZ NOT NULL,
  home_score INT,
  away_score INT,

  -- Prevent a team from playing against itself
  CONSTRAINT different_teams CHECK (home_team_id <> away_team_id)
);

-- ------------------------------------------------------------
-- Seed data (optional, useful for demo and testing)
-- ------------------------------------------------------------

-- Predefined sports fields for development and demo purposes
INSERT INTO fields (name, sport, address) VALUES
  ('Calisthenics Arena', 'football', 'Via Roma 1, Torino'),
  ('California Team Court', 'basketball', 'Viale Europa 10, Milano'),
  ('Volley Club', 'volleyball', 'Piazza Garibaldi 5, Bologna');
