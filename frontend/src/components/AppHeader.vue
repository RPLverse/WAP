/**
 * @file AppHeader.vue
 * @description Application header with clickable logo redirecting to home.
 */

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * Navigate to the home page.
 */
function goHome() {
  router.push('/');
}
</script>

<template>
  <header class="app-header">
    <img
      src="@/assets/units-logo.png"
      alt="University of Trieste Logo"
      class="logo"
      @click="goHome"
    />
    <h1 class="title">Sports Field Booking & Tournaments</h1>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #ddd;
  background-color: #ffffff;
}

.logo {
  height: 48px;
  max-width: 160px;
  object-fit: contain;
  cursor: pointer;
}

.title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}
</style>
