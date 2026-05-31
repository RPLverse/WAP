<template>
  <div>
    <div class="card">
      <h2>Tournaments</h2>

      <!-- The search is explicit: the list is filtered only when the user submits the form. -->
      <form class="row" @submit.prevent="loadTournaments(true)">
        <input v-model="q" placeholder="Search tournaments..." />
        <select v-model="status">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <!-- Real request errors and explicit empty searches are shown in the same place. -->
      <p v-if="visibleMessage" class="error">{{ visibleMessage }}</p>
    </div>

    <div v-if="token" class="card">
      <h3>Create tournament</h3>
      <form class="row" @submit.prevent="createTournament">
        <input v-model="newName" placeholder="Tournament name" required />
        <select v-model="newSport" required>
          <option disabled value="">Sport</option>
          <option value="football">Football</option>
          <option value="volleyball">Volleyball</option>
          <option value="basketball">Basketball</option>
        </select>
        <input v-model.number="newMaxTeams" type="number" min="2" placeholder="Max teams" required />
        <input v-model="newStartDate" type="date" required />
        <button type="submit">Create</button>
      </form>
    </div>

    <div v-for="t in tournaments" :key="t.id" class="card">
      <h3>
        <RouterLink :to="`/tournaments/${t.id}`">{{ t.name }}</RouterLink>
      </h3>
      <p class="small">
        {{ t.sport }} • starts {{ t.startDate }} • max teams {{ t.maxTeams }} • status {{ t.status }} • creator {{ t.creator.username }}
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * @file TournamentsView.vue
 * @description Tournaments list with explicit search and authenticated tournament creation.
 */

import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { apiRequest } from "../api/client.js";
import { authState } from "../store/auth.js";

const token = computed(() => authState.token);

const q = ref("");
const status = ref("all");
const tournaments = ref([]);
const message = ref("");
const hasUserSearched = ref(false);
const loading = ref(false);

const newName = ref("");
const newSport = ref("");
const newMaxTeams = ref(4);
const newStartDate = ref(new Date().toISOString().slice(0, 10));

/**
 * Message displayed below the search controls.
 * Empty-result messages are shown only after an explicit user search,
 * not during the initial page load.
 */
const visibleMessage = computed(() => {
  if (message.value) return message.value;
  if (hasUserSearched.value && !loading.value && tournaments.value.length === 0) return "Tournament not found.";
  return "";
});

/**
 * Loads tournaments according to the current search and status filters.
 * @param {boolean} triggeredByUser true when the user pressed the Search button.
 */
async function loadTournaments(triggeredByUser = false) {
  message.value = "";
  loading.value = true;

  if (triggeredByUser) {
    hasUserSearched.value = true;
  }

  try {
    const params = new URLSearchParams();
    if (q.value.trim()) params.set("q", q.value.trim());
    if (status.value) params.set("status", status.value);

    const result = await apiRequest(`/tournaments?${params.toString()}`);
    tournaments.value = Array.isArray(result) ? result : [];
  } catch (e) {
    tournaments.value = [];
    message.value = e?.message ?? "Unable to load tournaments.";
  } finally {
    loading.value = false;
  }
}

/**
 * Creates a tournament for the authenticated user.
 */
async function createTournament() {
  message.value = "";

  try {
    await apiRequest("/tournaments", {
      method: "POST",
      json: {
        name: newName.value,
        sport: newSport.value,
        maxTeams: newMaxTeams.value,
        startDate: newStartDate.value
      }
    });

    newName.value = "";
    newSport.value = "";
    await loadTournaments(false);
  } catch (e) {
    message.value = e?.message ?? "Create failed.";
  }
}

onMounted(() => loadTournaments(false));
</script>
