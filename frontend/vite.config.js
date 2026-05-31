/**
 * @file vite.config.js
 * @description Vite configuration for the Vue 3 frontend.
 */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true
  }
});
