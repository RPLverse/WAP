/**
 * @file client.js
 * @description Fetch wrapper for the backend REST API.
 */

import { authState, setToken } from "../store/auth.js";

/**
 * Base URL of the backend API.
 * It defaults to a relative /api path so the same build works behind any
 * host/domain when the frontend container reverse-proxies API calls.
 * It can still be overridden at build time via VITE_API_BASE.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

/**
 * @typedef {Object} ApiError
 * @property {number} status
 * @property {string} message
 */

/**
 * Performs an API request.
 *
 * @param {string} path Relative API path (e.g. "/fields")
 * @param {Object} [options] Fetch options
 * @param {*} [options.json] Optional JSON body (will be stringified)
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
export async function apiRequest(path, options = {}) {
  // Build full request URL.
  // For GET requests we append a small cache-busting parameter.
  // This prevents the browser from reusing a previous cached response or
  // receiving a 304 response with no body while the user is changing filters.
  const method = (options.method ?? "GET").toUpperCase();
  const requestUrl = new URL(`${API_BASE}${path}`, window.location.origin);
  if (method === "GET") {
    requestUrl.searchParams.set("_", String(Date.now()));
  }
  const url = requestUrl.pathname + requestUrl.search;

  // Initialize headers, preserving any custom headers passed by the caller
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");

  // Automatically enable JSON content type when a JSON payload is provided
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Automatically attach JWT token when the user is authenticated
  if (authState.token) {
    headers.set("Authorization", `Bearer ${authState.token}`);
  }

  // Perform the HTTP request, serializing JSON payloads when provided.
  // API responses are not cached: list/search endpoints must always reflect
  // the current filters and must not return browser 304 responses with no body.
  const resp = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body
  });

  // 204 No Content responses do not include a response body
  if (resp.status === 204) {
    return undefined;
  }

  // Parse response payload based on content type
  const isJson = resp.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await resp.json() : await resp.text();

  if (!resp.ok) {
    const message =
      typeof payload === "object" && payload && payload.error
        ? payload.error
        : `Request failed (${resp.status})`;

    // Automatically log out the user if the token is invalid or expired
    if (resp.status === 401) setToken(null);

    const err = new Error(message);
    err.status = resp.status;
    throw err;
  }

  return payload;
}
