<template>
  <div>
    <div class="card" v-if="field">
      <h2>{{ field.name }}</h2>
      <p class="small">{{ field.sport }} • {{ field.address }}</p>
      <p class="small">Bookable hours: {{ field.openingHour }}:00 - {{ field.closingHour }}:00, slot {{ field.slotDurationMinutes }} minutes</p>
    </div>

    <div class="card">
      <h3>Availability</h3>
      <div class="row">
        <input type="date" v-model="date" />
        <button @click="loadSlots">Load slots</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="slots.length === 0" class="small">No available slots for the selected date.</div>
      <div v-for="s in slots" :key="s.startTime" class="row" style="justify-content: space-between;">
        <div class="small">
          {{ formatDateTime(s.startTime) }} → {{ formatDateTime(s.endTime) }}
        </div>
        <button v-if="token" @click="bookSlot(s)">Book</button>
        <span v-else class="small">Login to book</span>
      </div>
    </div>

    <div class="card" v-if="token && bookings.length">
      <h3>Your bookings (this session)</h3>
      <div v-for="b in bookings" :key="b.id" class="row" style="justify-content: space-between;">
        <div class="small">
          {{ formatDateTime(b.startTime) }} → {{ formatDateTime(b.endTime) }}
        </div>
        <button @click="cancelBooking(b)">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file FieldDetailView.vue
 * @description Field details + availability + booking.
 */

import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { apiRequest } from "../api/client.js";
import { authState } from "../store/auth.js";

const route = useRoute();
const fieldId = computed(() => route.params.id);
const token = computed(() => authState.token);

const field = ref(null);
const date = ref(new Date().toISOString().slice(0, 10));
const slots = ref([]);
const bookings = ref([]);
const error = ref("");

/**
 * Formats an ISO date-time into a short local string.
 * @param {string} iso
 */
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

/**
 * Loads field details.
 */
async function loadField() {
  error.value = "";
  try {
    field.value = await apiRequest(`/fields/${fieldId.value}`);
  } catch (e) {
    error.value = e?.message ?? "Unable to load field";
  }
}

/**
 * Loads available slots for the selected date.
 */
async function loadSlots() {
  error.value = "";
  try {
    const data = await apiRequest(`/fields/${fieldId.value}/slots?date=${date.value}`);
    slots.value = data;
  } catch (e) {
    error.value = e?.message ?? "Unable to load slots";
  }
}

/**
 * Books a slot.
 * @param {{startTime: string, endTime: string}} s
 */
async function bookSlot(s) {
  error.value = "";
  try {
    const booking = await apiRequest(`/fields/${fieldId.value}/bookings`, {
      method: "POST",
      json: { startTime: s.startTime, endTime: s.endTime }
    });

    bookings.value.unshift(booking);

    // Remove the booked slot from availability.
    slots.value = slots.value.filter((x) => x.startTime !== s.startTime);
  } catch (e) {
    error.value = e?.message ?? "Booking failed";
  }
}

/**
 * Cancels a booking.
 * @param {any} booking
 */
async function cancelBooking(booking) {
  error.value = "";
  try {
    await apiRequest(`/fields/${fieldId.value}/bookings/${booking.id}`, { method: "DELETE" });
    bookings.value = bookings.value.filter((b) => b.id !== booking.id);

    // Reload slots (so the canceled slot appears again).
    await loadSlots();
  } catch (e) {
    error.value = e?.message ?? "Cancel failed";
  }
}

onMounted(async () => {
  await loadField();
  await loadSlots();
});

watch(fieldId, async () => {
  bookings.value = [];
  await loadField();
  await loadSlots();
});
</script>
