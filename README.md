# WAP Sports Booking & Tournaments

The project was created as an exercise for the **Web Application Programming** exam (MSc in Computer Engineering).

## 1. Goal

This project implements a full-stack web application that supports:

- Sports field discovery and booking
- Tournament creation and management
- Automatic match generation (single round-robin)
- Result entry and automatic standings computation

All required features and REST endpoints follow the official course project specification.

The application is designed to run using Docker Compose.

---

## 2. Tech Stack

- **Backend**: Node.js + Express (ES modules)
- **Persistence**: Sequelize ORM + PostgreSQL
- **Frontend**: Vue 3 (Vite, Composition API)
- **Authentication**: JWT (Bearer token) + bcrypt password hashing
- **Deployment**: Docker Compose (Node/Express application + PostgreSQL)

---

## 3. High-Level Architecture

The system follows a classic three-tier architecture:

```
[ Vue SPA ]  →  [ Express REST API + Sequelize ORM ]  →  [ PostgreSQL ]
```

The backend exposes a REST API under `/api`. The frontend is a minimal SPA that consumes the API via `fetch` and provides a basic UI for the required use cases.

---

## 4. Backend Structure and Responsibilities

The backend is organized to keep responsibilities clearly separated:

- `routes/*`
  - HTTP-only layer (routing, status codes, request/response)
- `services/*`
  - Business logic and domain rules (booking constraints, tournament lifecycle, schedule generation, standings computation)
- `models/*`
  - Sequelize models and associations (table ↔ entity mapping)
- `middleware/*`
  - Authentication and centralized error handling
- `utils/*`
  - Small utilities (async handler wrapper, typed HTTP errors)

---

## 5. Data Model (PostgreSQL) and ORM (Object-Relational Mapping)

### 5.1 Enum
- `sport_type`: `football | volleyball | basketball`

### 5.2 Tables

- `users(id, username, password_hash, name, surname)`
- `fields(id, name, sport, address, opening_hour, closing_hour, slot_duration_minutes)`
- `field_bookings(id, field_id, user_id, start_time, end_time)`
  - unique `(field_id, start_time, end_time)` to prevent double booking
- `tournaments(id, name, sport, max_teams, start_date, creator_id)`
- `teams(id, tournament_id, name)`
  - unique `(tournament_id, name)` to prevent duplicate team names within the same tournament
- `players(id, team_id, name, surname, jersey_no)`
- `matches(id, tournament_id, home_team_id, away_team_id, match_time, home_score, away_score)`

### 5.3 Sequelize Models and Associations

Each table is mapped to a Sequelize model:

- `User`, `Field`, `FieldBooking`, `Tournament`, `Team`, `Player`, `Match`

Key associations:

- `Tournament hasMany Team` (as `teams`)
- `Team hasMany Player` (as `players`)
- `Tournament hasMany Match` (as `matches`)
- `Match belongsTo Team` twice (as `homeTeam` and `awayTeam`)
- `User hasMany Tournament` (as `createdTournaments`)
- `Field hasMany FieldBooking` (as `bookings`)
- `User hasMany FieldBooking` (as `fieldBookings`)

Using an ORM improves maintainability by removing raw SQL strings from route handlers and by allowing object-oriented navigation across relations. Database tables are mapped to application classes, rows to object instances, and relationships to associations between objects, enabling the backend to work with domain entities rather than SQL queries.
At the same time, PostgreSQL remains the source of truth for data integrity constraints (e.g., unique booking slots).
The ORM layer also provides database independence, as the same application code can run on different relational database systems supported by Sequelize (e.g., Microsoft SQL Server, MySQL, PostgreSQL, ...) with minimal changes.

---

## 6. Authentication and Authorization

- `POST /api/auth/signup` registers a new user
- `POST /api/auth/signin` returns a JWT (valid for 7 days)
- All **write** operations require authentication via `Authorization: Bearer <token>`

Authorization rules:

- Only the tournament **creator** can:
  - Edit/delete the tournament
  - Add teams/players
  - Generate matches
  - Insert match results
- Field bookings can be cancelled only by the user who created them

Authentication is implemented as Express middleware (`requireAuth`) that validates JWT and attaches a minimal user object to `req.user`.

---

## 7. Business Rules Implemented

### 7.1 Field Booking
- Booking is refused for **past** time slots
- Booking conflicts are prevented at DB level via a uniqueness constraint
- Only **upcoming** bookings can be cancelled, and only by the booking owner

### 7.2 Tournament Lifecycle
- Creating a tournament stores name, sport, max teams and start date
- Editing a tournament is creator-only; `maxTeams` cannot go below the already registered teams
- Deleting a tournament is creator-only and allowed only if no matches exist

### 7.3 Schedule Generation
- Single round-robin schedule (circle method)
- Matches can be generated **only once**
- Generation is executed inside a Sequelize transaction to ensure atomicity

### 7.4 Results and Standings
- Results can be inserted only by the tournament creator and only after match time
- Standings are computed dynamically from matches with results
- Points rules:
  - Football: win = 3, draw = 1, loss = 0
  - Volleyball/basketball: win = 2, loss = 0

---

## 8. Centralized Error Handling and Validation

The backend uses:

- Typed error classes (`ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, ...)
- A single error-handling middleware that converts domain errors into proper HTTP status codes and JSON payloads
- An `asyncHandler` wrapper to forward rejected async handlers to the centralized error middleware

This avoids duplicated try/catch blocks, keeps routes clean, and makes error behavior consistent across the API.

---

## 9. Configuration 

Environment-specific configuration is provided via environment variables:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`

This makes the system portable and easy to run in different environments (local machine, Docker, ...).

---

## 10. REST API Summary

Implemented endpoints (see `routes/*` for payload details):

- Auth: `POST /api/auth/signup`, `POST /api/auth/signin`
- Session: `GET /api/whoami`
- Fields: `GET /api/fields`, `GET /api/fields/:id`, `GET /api/fields/:id/slots`, `POST /api/fields/:id/bookings`, `DELETE /api/fields/:id/bookings/:bookingId`
- Tournaments: `GET /api/tournaments`, `POST /api/tournaments`, `GET /api/tournaments/:id`, `PUT /api/tournaments/:id`, `DELETE /api/tournaments/:id`
- Teams: `POST /api/tournaments/:id/teams`, `GET /api/tournaments/:id/teams`
- Players: `POST /api/teams/:id/players`, `GET /api/teams/:id/players`
- Matches: `POST /api/tournaments/:id/matches/generate`, `GET /api/tournaments/:id/matches`, `GET /api/matches/:id`, `PUT /api/matches/:id/result`
- Standings: `GET /api/tournaments/:id/standings`
- Users: `GET /api/users`, `GET /api/users/:id`

---

## 11. Code Documentation (JSDoc)

The backend codebase is documented using **JSDoc** to describe service functions and business logic.
Formal documentation is generated only for the backend, which exposes the public API, while frontend
code is documented inline inside Vue components. The docs/ directory is not committed to the repository.

From the `backend/` directory, documentation can be generated with:
```bash
npm install
npm run docs
```

## 12. Deployment and Docker Usage

The project is containerized using Docker Compose and runs two services:

- `web`: a single Node.js/Express container that serves both:
  - the REST API under `/api`;
  - the compiled Vue static files;
- `db`: the PostgreSQL database.

The Vue frontend is compiled with Vite during the Docker image build. The generated HTML, CSS and JavaScript files are copied into the final application image and served directly by Express.

The browser accesses both the frontend and the API through the same origin. For example:

```text
http://localhost:8080/
http://localhost:8080/api/fields
```

Because frontend and backend use the same origin:

- no CORS configuration is required;
- no separate Nginx container is required;
- no backend URL is hard-coded to `localhost`;
- the frontend calls the backend using relative paths such as `/api/fields`.

The same image can therefore be deployed using a local address, an IP address or a domain name without changing the frontend source code.

From the repository root, start the application with:

```bash
docker compose up --build
```

Alternatively, run it in the background:

```bash
docker compose up -d --build
```

Once the containers are running, open:

```text
http://localhost:8080
```

From another computer, if the server firewall allows access:

```text
http://<server-host>:8080
```

The public port can be changed through the `WEB_PORT` environment variable:

```bash
WEB_PORT=80 docker compose up --build
```

Useful commands:

```bash
docker compose ps        # Show the two services and their status
docker compose logs -f   # Stream logs from both services
docker compose down      # Stop and remove containers, preserving data
docker compose down -v   # Stop containers and remove the database volume
```

### 12.1 Database Persistence

PostgreSQL data is persisted using a Docker volume mounted under:

```text
/var/lib/postgresql/data
```

Stopping and restarting the containers does not remove users, tournaments, bookings or other stored data:

```bash
docker compose down
docker compose up --build
```

To remove the database volume and recreate the database from scratch:

```bash
docker compose down -v
docker compose up --build
```

This separates the application lifecycle from the data lifecycle.

---

## 13. Request Lifecycle Example

Example: *Create Tournament*

1. Vue sends `POST /api/tournaments` with the Bearer token
2. Express authenticates the user (`requireAuth`)
3. Route delegates to `tournamentService.createTournament(...)`
4. Sequelize persists the entity in PostgreSQL
5. The created tournament is returned as JSON

---

## 14. Testing Notes

Suggested manual test flow:

1. Sign up → sign in → store JWT
2. Create a tournament
3. Add teams until `maxTeams`
4. Generate matches
5. Insert results for past matches
6. Read standings
7. Book and cancel a field slot
