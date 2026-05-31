<template>
  <div class="card">
    <h2>Login</h2>
    <form class="row" @submit.prevent="onSubmit">
      <input v-model="username" placeholder="Username" autocomplete="username" required />
      <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required />
      <button type="submit">Sign in</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p class="small">
      No account? <RouterLink to="/signup">Create one</RouterLink>
    </p>
  </div>
</template>

<script setup>
/**
 * @file LoginView.vue
 * @description Simple login page.
 */

import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { apiRequest } from "../api/client.js";
import { authState, setToken } from "../store/auth.js";

const router = useRouter();
const username = ref("");
const password = ref("");
const error = ref("");

/**
 * Handles login.
 */
async function onSubmit() {
  error.value = "";
  try {
    const data = await apiRequest("/auth/signin", {
      method: "POST",
      json: { username: username.value, password: password.value }
    });

    // Store the JWT first so the next API request includes the Authorization header.
    setToken(data.token);

    // The signin endpoint returns the token only, so we explicitly load the
    // current user profile from /whoami before navigating to the application.
    authState.user = await apiRequest("/whoami");

    router.push("/fields");
  } catch (e) {
    error.value = e?.message ?? "Login failed";
  }
}
</script>
