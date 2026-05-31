<template>
  <div class="container">
    <header class="header">
      <div class="header-top" @click="goHome">
        <img
          src="./assets/units-logo.png"
          alt="University of Trieste Logo"
          class="logo"
        />
        <h1>WAP Sports Booking & Tournaments</h1>
      </div>

      <nav class="nav">
        <RouterLink to="/fields">Fields</RouterLink>
        <RouterLink to="/tournaments">Tournaments</RouterLink>
        <RouterLink to="/users">Users</RouterLink>
        <span class="spacer"></span>
        <RouterLink v-if="!token" to="/login">Login</RouterLink>
        <RouterLink v-if="!token" to="/signup">Sign up</RouterLink>
        <button v-if="token" class="link" @click="onLogout">Logout</button>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
/**
 * @file App.vue
 * @description Root layout and navigation.
 */

import { computed, onMounted } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { apiRequest } from "./api/client.js";
import { authState, logout } from "./store/auth.js";
import { useRouter } from "vue-router";

const router = useRouter();

/**
 * Navigate to the home page.
 */
function goHome() {
  router.push("/");
}

const token = computed(() => authState.token);

/**
 * Loads the current user (if authenticated).
 */
async function loadWhoAmI() {
  if (!authState.token) return;
  try {
    authState.user = await apiRequest("/whoami");
  } catch {
    // ignore
  }
}

function onLogout() {
  logout();
}

onMounted(loadWhoAmI);
</script>

<style>
:root {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 16px;
}

.header {
  border-bottom: 1px solid #ddd;
  margin-bottom: 16px;
}

.nav {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 0 16px;
}

.nav a {
  text-decoration: none;
}

.spacer {
  flex: 1;
}

.link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #0b57d0;
}

.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
}

.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

input, select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
}

.small {
  font-size: 0.9rem;
  color: #444;
}

.error {
  color: #b00020;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo {
  height: 48px;
  max-width: 160px;
  object-fit: contain;
}
</style>
