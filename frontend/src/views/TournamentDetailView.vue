<template>
  <div v-if="tournament">
    <div class="card">
      <h2>{{ tournament.name }}</h2>
      <p class="small">
        {{ tournament.sport }} • starts {{ formatDate(tournament.startDate) }}
        • max teams {{ tournament.maxTeams }}
        • status {{ tournament.status }}
      </p>

      <p class="small">Creator: {{ tournament.creator.username }}</p>

      <!-- Only the tournament creator can manage teams, players, matches and results. -->
      <p v-if="isCreator" class="small" style="margin-top: 10px;">
        You are the creator of this tournament and can manage teams, players and results.
      </p>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </div>

    <!-- TEAMS AND PLAYERS -->
    <div class="card">
      <h3>Teams ({{ teams.length }} / {{ tournament.maxTeams }})</h3>

      <!-- Only the tournament creator can add teams. -->
      <form
        v-if="isCreator && teams.length < tournament.maxTeams"
        class="row"
        style="margin-bottom: 12px;"
        @submit.prevent="addTeam"
      >
        <input
          v-model="newTeamName"
          placeholder="Team name"
          required
        />
        <button type="submit">Add team</button>
      </form>

      <p v-else-if="isCreator" class="small">
        Maximum number of teams reached.
      </p>

      <div v-if="teams.length" class="stack">
        <div v-for="team in teams" :key="team.id" class="nested-card">
          <h4>{{ team.name }}</h4>

          <p class="small">Players ({{ playersByTeam[team.id]?.length ?? 0 }})</p>

          <ul v-if="playersByTeam[team.id]?.length">
            <li v-for="player in playersByTeam[team.id]" :key="player.id">
              {{ player.name }} {{ player.surname }}
              <span v-if="player.jerseyNo !== null && player.jerseyNo !== undefined">
                #{{ player.jerseyNo }}
              </span>
            </li>
          </ul>

          <p v-else class="small">No players in this team yet.</p>

          <!-- Players are domain entities, not application users. -->
          <form
            v-if="isCreator"
            class="row"
            style="margin-top: 8px;"
            @submit.prevent="addPlayer(team.id)"
          >
            <input
              v-model="playerForms[team.id].name"
              placeholder="Player name"
              required
            />
            <input
              v-model="playerForms[team.id].surname"
              placeholder="Player surname"
              required
            />
            <input
              v-model="playerForms[team.id].jerseyNo"
              placeholder="Jersey #"
              type="number"
              min="1"
            />
            <button type="submit">Add player</button>
          </form>
        </div>
      </div>

      <p v-else class="small">No teams have been added yet.</p>
    </div>

    <!-- MATCHES -->
    <div class="card">
      <h3>Matches</h3>

      <!-- The creator can generate a single round-robin schedule once at least two teams exist. -->
      <button
        v-if="isCreator && matches.length === 0 && teams.length >= 2"
        @click="generateMatches"
      >
        Generate round-robin schedule
      </button>

      <p v-else-if="matches.length === 0" class="small">
        Add at least two teams to generate the match schedule.
      </p>

      <table v-if="matches.length" class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Home team</th>
            <th>Away team</th>
            <th>Result</th>
            <th v-if="isCreator">Update result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="match in matches" :key="match.id">
            <td>{{ formatDateTime(match.matchTime) }}</td>
            <td>{{ match.homeTeam?.name ?? "-" }}</td>
            <td>{{ match.awayTeam?.name ?? "-" }}</td>
            <td>{{ displayResult(match) }}</td>
            <td v-if="isCreator">
              <form class="row" @submit.prevent="setResult(match.id)">
                <input
                  v-model="resultForms[match.id].homeScore"
                  type="number"
                  min="0"
                  placeholder="Home"
                  required
                />
                <input
                  v-model="resultForms[match.id].awayScore"
                  type="number"
                  min="0"
                  placeholder="Away"
                  required
                />
                <button type="submit">Save</button>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- STANDINGS -->
    <div class="card">
      <h3>Standings</h3>

      <table v-if="standings.length" class="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Pts</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>For</th>
            <th>Against</th>
            <th>Diff</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in standings" :key="row.teamId">
            <td>{{ row.teamName }}</td>
            <td>{{ row.points }}</td>
            <td>{{ row.played }}</td>
            <td>{{ row.wins }}</td>
            <td>{{ row.draws }}</td>
            <td>{{ row.losses }}</td>
            <td>{{ row.goalsFor }}</td>
            <td>{{ row.goalsAgainst }}</td>
            <td>{{ row.goalDiff }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="small">No standings available yet.</p>
    </div>
  </div>
</template>

<script setup>
/**
 * @file TournamentDetailView.vue
 * @description Tournament detail page with teams, players, matches and standings.
 */

import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { apiRequest } from "../api/client.js";
import { authState } from "../store/auth.js";

const route = useRoute();
const tournamentId = route.params.id;

const tournament = ref(null);
const teams = ref([]);
const matches = ref([]);
const standings = ref([]);
const error = ref("");
const success = ref("");
const newTeamName = ref("");

// Player forms are keyed by team id so each team has its own independent form state.
const playerForms = reactive({});

// Result forms are keyed by match id so each match has its own independent score form.
const resultForms = reactive({});

// Loaded players are grouped by team id to simplify rendering.
const playersByTeam = reactive({});

const isCreator = computed(() => {
  return authState.user?.id === tournament.value?.creator?.id;
});

/**
 * Shows a short success message and clears the previous error.
 *
 * @param {string} message Message to display.
 */
function showSuccess(message) {
  error.value = "";
  success.value = message;
}

/**
 * Shows an error message and clears the previous success message.
 *
 * @param {unknown} e Error object returned by apiRequest.
 * @param {string} fallback Fallback message.
 */
function showError(e, fallback) {
  success.value = "";
  error.value = e?.message ?? fallback;
}

/**
 * Formats a date value for compact display.
 *
 * @param {string|Date} value Date value.
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

/**
 * Formats a date-time value for compact display.
 *
 * @param {string|Date} value Date-time value.
 * @returns {string}
 */
function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

/**
 * Displays a result only when both scores are available.
 *
 * @param {Object} match Match object.
 * @returns {string}
 */
function displayResult(match) {
  if (match.homeScore === null || match.awayScore === null) return "Not played";
  return `${match.homeScore} - ${match.awayScore}`;
}

/**
 * Ensures that authState.user is loaded when a token is already present.
 * This is important after page refreshes and immediately after login.
 */
async function ensureCurrentUser() {
  if (!authState.token || authState.user) return;
  authState.user = await apiRequest("/whoami");
}

/**
 * Loads the main tournament object.
 */
async function loadTournament() {
  tournament.value = await apiRequest(`/tournaments/${tournamentId}`);
}

/**
 * Initializes empty player forms for newly loaded teams.
 */
function ensurePlayerForms() {
  for (const team of teams.value) {
    if (!playerForms[team.id]) {
      playerForms[team.id] = { name: "", surname: "", jerseyNo: "" };
    }
  }
}

/**
 * Loads all teams and their players.
 */
async function loadTeamsAndPlayers() {
  teams.value = await apiRequest(`/tournaments/${tournamentId}/teams`);
  ensurePlayerForms();

  // The players endpoint is team-based, so we load players for each team separately.
  await Promise.all(
    teams.value.map(async (team) => {
      playersByTeam[team.id] = await apiRequest(`/teams/${team.id}/players`);
    })
  );
}

/**
 * Initializes result forms from the current match list.
 */
function ensureResultForms() {
  for (const match of matches.value) {
    if (!resultForms[match.id]) {
      resultForms[match.id] = {
        homeScore: match.homeScore ?? "",
        awayScore: match.awayScore ?? ""
      };
    }
  }
}

/**
 * Loads tournament matches.
 */
async function loadMatches() {
  matches.value = await apiRequest(`/tournaments/${tournamentId}/matches`);
  ensureResultForms();
}

/**
 * Loads computed standings.
 */
async function loadStandings() {
  standings.value = await apiRequest(`/tournaments/${tournamentId}/standings`);
}

/**
 * Refreshes all tournament-related data shown on this page.
 */
async function refreshAll() {
  await ensureCurrentUser();
  await loadTournament();
  await loadTeamsAndPlayers();
  await loadMatches();
  await loadStandings();
}

/**
 * Adds a team to the tournament.
 */
async function addTeam() {
  try {
    await apiRequest(`/tournaments/${tournamentId}/teams`, {
      method: "POST",
      json: { name: newTeamName.value }
    });

    newTeamName.value = "";
    showSuccess("Team added successfully");
    await refreshAll();
  } catch (e) {
    showError(e, "Team creation failed");
  }
}

/**
 * Adds a player to a specific team.
 *
 * @param {string} teamId Team identifier.
 */
async function addPlayer(teamId) {
  const form = playerForms[teamId];

  try {
    await apiRequest(`/teams/${teamId}/players`, {
      method: "POST",
      json: {
        name: form.name,
        surname: form.surname,
        jerseyNo: form.jerseyNo === "" ? null : Number(form.jerseyNo)
      }
    });

    playerForms[teamId] = { name: "", surname: "", jerseyNo: "" };
    showSuccess("Player added successfully");
    await loadTeamsAndPlayers();
  } catch (e) {
    showError(e, "Player creation failed");
  }
}

/**
 * Generates the round-robin match schedule for this tournament.
 */
async function generateMatches() {
  try {
    await apiRequest(`/tournaments/${tournamentId}/matches/generate`, {
      method: "POST"
    });

    showSuccess("Match schedule generated successfully");
    await refreshAll();
  } catch (e) {
    showError(e, "Match generation failed");
  }
}

/**
 * Inserts or updates the result of a match.
 *
 * @param {string} matchId Match identifier.
 */
async function setResult(matchId) {
  const form = resultForms[matchId];

  try {
    await apiRequest(`/matches/${matchId}/result`, {
      method: "PUT",
      json: {
        homeScore: Number(form.homeScore),
        awayScore: Number(form.awayScore)
      }
    });

    showSuccess("Match result saved successfully");
    await loadMatches();
    await loadStandings();
    await loadTournament();
  } catch (e) {
    showError(e, "Result update failed");
  }
}

onMounted(async () => {
  try {
    await refreshAll();
  } catch (e) {
    showError(e, "Unable to load tournament data");
  }
});
</script>

<style scoped>
.stack {
  display: grid;
  gap: 12px;
}

.nested-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid #e0e0e0;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.success {
  color: #0b7a30;
}
</style>
