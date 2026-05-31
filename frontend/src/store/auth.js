/**
 * @file auth.js
 * @description Tiny auth state backed by localStorage.
 */

import { reactive } from "vue";

// Key used to persist the JWT token in localStorage
const TOKEN_KEY = "wap_token";

/**
 * @typedef {Object} AuthState
 * @property {string|null} token
 * @property {Object|null} user
 */

/**
 * Reactive authentication state shared across the application.
 * It persists the JWT token in localStorage.
 * @type {AuthState}
 */
export const authState = reactive({
  token: localStorage.getItem(TOKEN_KEY),
  user: null
});

/**
 * Sets the JWT token.
 * @param {string|null} token
 */
export function setToken(token) {
  authState.token = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Logs out.
 */
export function logout() {
  setToken(null);
  authState.user = null;
}
