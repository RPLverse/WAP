<template>
  <div class="card">
    <h2>Sign up</h2>
    <form class="row" @submit.prevent="onSubmit">
      <input v-model="username" placeholder="Username" autocomplete="username" required />
      <input v-model="password" type="password" placeholder="Password" autocomplete="new-password" required />
      <input v-model="name" placeholder="Name" autocomplete="given-name" required />
      <input v-model="surname" placeholder="Surname" autocomplete="family-name" required />
      <button type="submit">Create account</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p class="small">
      Already registered? <RouterLink to="/login">Login</RouterLink>
    </p>
  </div>
</template>

<script setup>
/**
 * @file SignupView.vue
 * @description User registration page.
 */

import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { apiRequest } from "../api/client.js";

const router = useRouter();
const username = ref("");
const password = ref("");
const name = ref("");
const surname = ref("");
const error = ref("");

/**
 * Handles signup.
 */
async function onSubmit() {
  error.value = "";
  try {
    await apiRequest("/auth/signup", {
      method: "POST",
      json: {
        username: username.value,
        password: password.value,
        name: name.value,
        surname: surname.value
      }
    });

    // After successful signup, redirect to login.
    router.push("/login");
  } catch (e) {
    error.value = e?.message ?? "Signup failed";
  }
}
</script>
