/**
 * @file main.js
 * @description Vue application bootstrap.
 */

import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router.js";

// Create the Vue application, register the router and mount it to the DOM
createApp(App).use(router).mount("#app");
