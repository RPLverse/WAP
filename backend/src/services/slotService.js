/**
 * @file slotService.js
 * @description Computes available booking slots for sports fields.
 */

import { Op } from "sequelize";
import { Field, FieldBooking } from "../models/index.js";
import { NotFoundError, ValidationError } from "../utils/error.js";

/**
 * Computes available booking slots for a given field on a given date.
 *
 * @param {string} fieldId Field identifier.
 * @param {string} dateISO Date in YYYY-MM-DD format.
 * @returns {Promise<Array<{startTime:string,endTime:string,available:boolean}>>}
 */
export async function getFieldSlots(fieldId, dateISO) {
  // Ensure the field exists
  const field = await Field.findByPk(fieldId);
  if (!field) throw new NotFoundError("Field not found");

  // Validate date format
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    throw new ValidationError("Invalid date format (expected YYYY-MM-DD)");
  }

  // Compute day boundaries in UTC
  const dayStart = new Date(`${dateISO}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateISO}T23:59:59.999Z`);

  // Retrieve all bookings for the given field and day
  const bookings = await FieldBooking.findAll({
    where: {
      fieldId,
      startTime: { [Op.gte]: dayStart, [Op.lte]: dayEnd }
    }
  });

  // Normalize booked slots into a set for fast lookup
  const booked = new Set(
    bookings.map(
      b =>
        `${new Date(b.startTime).toISOString()}|${new Date(b.endTime).toISOString()}`
    )
  );

  // Field configuration with sensible defaults
  const openingHour = field.openingHour ?? 8;
  const closingHour = field.closingHour ?? 22;
  const slotMinutes = field.slotDurationMinutes ?? 60;

  const slots = [];
  const base = new Date(`${dateISO}T00:00:00.000Z`);

  // Generate time slots between opening and closing hours
  for (let hour = openingHour; hour < closingHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      const start = new Date(base);
      start.setUTCHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setUTCMinutes(end.getUTCMinutes() + slotMinutes);

      // Skip slots that exceed closing time
      if (
        end.getUTCHours() > closingHour ||
        (end.getUTCHours() === closingHour && end.getUTCMinutes() > 0)
      ) {
        continue;
      }

      const key = `${start.toISOString()}|${end.toISOString()}`;

      slots.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        available: !booked.has(key)
      });
    }
  }

  return slots;
}
