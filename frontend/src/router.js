/**
 * @file router.js
 * @description Application routes.
 */

import { createRouter, createWebHistory } from "vue-router";

import LoginView from "./views/LoginView.vue";
import SignupView from "./views/SignupView.vue";
import FieldsView from "./views/FieldsView.vue";
import FieldDetailView from "./views/FieldDetailView.vue";
import TournamentsView from "./views/TournamentsView.vue";
import TournamentDetailView from "./views/TournamentDetailView.vue";
import UsersView from "./views/UsersView.vue";

/**
 * Application router instance.
 * @type {Object}
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/fields" },
    { path: "/login", component: LoginView },
    { path: "/signup", component: SignupView },
    { path: "/fields", component: FieldsView },
    { path: "/fields/:id", component: FieldDetailView, props: true },
    { path: "/tournaments", component: TournamentsView },
    { path: "/tournaments/:id", component: TournamentDetailView, props: true },
    { path: "/users", component: UsersView }
  ]
});
