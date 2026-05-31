/**
 * @file date.js
 * @description Date utility helpers.
 */

/**
 * Checks whether a given booking slot is in the past relative to the current time.
 *
 * The slot start time is computed by adding the slot index to the base opening hour.
 * This utility is typically used to prevent booking or cancelling time slots
 * that have already started.
 *
 * The comparison is performed using local time.
 *
 * @param {string} isoDate Date in YYYY-MM-DD format.
 * @param {number} slotStartHour Base opening hour (e.g. 8).
 * @param {number} slotIndex Slot offset from the base hour (e.g. 0 => opening hour).
 * @returns {boolean} True if the slot start time is in the past.
 */
export function isPastSlot(isoDate, slotStartHour, slotIndex) {
  const startHour = slotStartHour + slotIndex;

  // Construct slot start datetime at hour precision
  const slotDateTime = new Date(
    `${isoDate}T${String(startHour).padStart(2, "0")}:00:00`
  );

  return slotDateTime.getTime() < Date.now();
}
