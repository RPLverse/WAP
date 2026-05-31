<template>
  <div>
    <div class="card">
      <h2>Sports fields</h2>

      <!-- The search is explicit: the list is filtered only when the user submits the form. -->
      <form class="row" @submit.prevent="loadFields(true)">
        <input
          v-model="q"
          placeholder="Search fields by name..."
          style="width: 140px"
        />
        <select v-model="sport">
          <option value="">All sports</option>
          <option value="football">Football</option>
          <option value="volleyball">Volleyball</option>
          <option value="basketball">Basketball</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <!-- Real request errors and explicit empty searches are shown in the same place. -->
      <p v-if="visibleMessage" class="error">{{ visibleMessage }}</p>
    </div>

    <div v-for="f in fields" :key="f.id" class="card">
      <h3>
        <RouterLink :to="`/fields/${f.id}`">{{ f.name }}</RouterLink>
      </h3>
      <p class="small">{{ f.sport }} • {{ f.address }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * @file FieldsView.vue
 * @description Public fields list with explicit search and sport filtering.
 */

import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { apiRequest } from "../api/client.js";

const q = ref("");
const sport = ref("");
const fields = ref([]);
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
  if (hasUserSearched.value && !loading.value && fields.value.length === 0) return "Field not found.";
  return "";
});

/**
 * Loads fields according to the current search parameters.
 * @param {boolean} triggeredByUser true when the user pressed the Search button.
 */
async function loadFields(triggeredByUser = false) {
  message.value = "";
  loading.value = true;

  if (triggeredByUser) {
    hasUserSearched.value = true;
  }

  try {
    const params = new URLSearchParams();
    if (q.value.trim()) params.set("q", q.value.trim());
    if (sport.value) params.set("sport", sport.value);

    const result = await apiRequest(`/fields?${params.toString()}`);
    fields.value = Array.isArray(result) ? result : [];
  } catch (e) {
    fields.value = [];
    message.value = e?.message ?? "Unable to load fields.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadFields(false));
</script>
