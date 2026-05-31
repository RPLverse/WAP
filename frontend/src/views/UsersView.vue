<template>
  <div>
    <div class="card">
      <h2>Users</h2>

      <!-- The search is explicit: the list is filtered only when the user submits the form. -->
      <form class="row" @submit.prevent="loadUsers(true)">
        <input v-model="q" placeholder="Search users..." />
        <button type="submit">Search</button>
      </form>

      <!-- Real request errors and explicit empty searches are shown in the same place. -->
      <p v-if="visibleMessage" class="error">{{ visibleMessage }}</p>
    </div>

    <div v-for="u in users" :key="u.id" class="card">
      <h3>{{ u.username }} <span class="small">({{ u.name }} {{ u.surname }})</span></h3>
      <div>
        <ul>
          <li v-for="t in u.createdTournaments ?? []" :key="t.id">
            <RouterLink :to="`/tournaments/${t.id}`">{{ t.name }}</RouterLink>
            <span class="small">• {{ t.sport }} • {{ t.startDate }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file UsersView.vue
 * @description Public users list with explicit search.
 */

import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { apiRequest } from "../api/client.js";

const q = ref("");
const users = ref([]);
const message = ref("");
const hasUserSearched = ref(false);
const loading = ref(false);

/**
 * Message displayed below the search controls.
 * Empty-result messages are shown only after an explicit user search,
 * not during the initial page load.
 */
const visibleMessage = computed(() => {
  if (message.value) return message.value;
  if (hasUserSearched.value && !loading.value && users.value.length === 0) return "User not found.";
  return "";
});

/**
 * Loads users according to the current search parameter.
 * @param {boolean} triggeredByUser true when the user pressed the Search button.
 */
async function loadUsers(triggeredByUser = false) {
  message.value = "";
  loading.value = true;

  if (triggeredByUser) {
    hasUserSearched.value = true;
  }

  try {
    const params = new URLSearchParams();
    if (q.value.trim()) params.set("q", q.value.trim());

    const result = await apiRequest(`/users?${params.toString()}`);
    users.value = Array.isArray(result) ? result : [];
  } catch (e) {
    users.value = [];
    message.value = e?.message ?? "Unable to load users.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadUsers(false));
</script>
