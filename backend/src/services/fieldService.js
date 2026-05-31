/**
 * @file fieldService.js
 * @description Sports field discovery and booking domain logic.
 *
 * This service handles all business rules related to sports fields and bookings.
 * Responsibilities include:
 * - listing available sports fields
 * - retrieving field details
 * - creating and validating bookings
 * - enforcing authorization and time constraints
 *
 * Design notes:
 * - No HTTP / Express logic is present here
 * - Authentication is handled by middleware (JWT)
 * - Authorization and validation rules live in this layer
 */

import { Field, FieldBooking } from "../models/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from "../utils/error.js";
import { Op } from "sequelize";

/**
 * Lists sports fields.
 *
 * Supports optional filtering:
 * - by sport (exact match)
 * - by free-text search on name and address
 * - by mapped sport names such as "calcio", "football", "volley" or "basket"
 *
 * Text search is case-insensitive and implemented using ILIKE only on text columns.
 * Sport is stored as a PostgreSQL ENUM, so it is matched with exact enum comparisons.
 *
 * @param {Object} params Filtering parameters
 * @param {string} [params.sport] Sport type (football, volleyball, basketball)
 * @param {string} [params.q] Free-text search query
 * @returns {Promise<Array<Field>>}
 */
export async function listFields(params = {}) {
  const { sport } = params;

  // Normalize the free-text search parameter:
  // if it is missing, use an empty string, then remove extra spaces.
  const q = (params.q ?? "").trim();

  // Sequelize WHERE object built dynamically according to the received filters.
  const where = {};

  // Sport is a categorical filter: it must match one of the enum values
  // allowed by the database: football, volleyball, basketball.
  if (sport) {
    where.sport = sport;
  }

  if (q) {
    // Free-text search is applied only to textual columns.
    // We avoid using ILIKE on "sport" because in PostgreSQL it is an ENUM,
    // not a TEXT column.
    const orConditions = [
      { name: { [Op.iLike]: `%${q}%` } },
      { address: { [Op.iLike]: `%${q}%` } }
    ];

    // Normalize the query to lowercase so that we can recognize partial
    // or localized sport names, such as "cal", "calc", or "calcio".
    const normalized = q.toLowerCase();

    // If the user searches for "cal", "calc", "calcio", or "football",
    // add an exact enum comparison: sport = football.
    // This keeps the query valid because we do not apply ILIKE to the enum.
    if ("calcio".includes(normalized) || "football".includes(normalized)) {
      orConditions.push({ sport: "football" });
    }

    // Same idea for volleyball: recognize both English and Italian terms,
    // including partial searches, then use an exact enum comparison.
    if (
      "volleyball".includes(normalized) ||
      "volley".includes(normalized) ||
      "pallavolo".includes(normalized)
    ) {
      orConditions.push({ sport: "volleyball" });
    }

    // Same idea for basketball / basket / pallacanestro.
    if (
      "basketball".includes(normalized) ||
      "basket".includes(normalized) ||
      "pallacanestro".includes(normalized)
    ) {
      orConditions.push({ sport: "basketball" });
    }

    // Combine all conditions with OR:
    // a field is returned if it matches name, address, or the mapped sport.
    where[Op.or] = orConditions;
  }

  // Execute the query and sort fields alphabetically by name.
  return Field.findAll({
    where,
    order: [["name", "ASC"]]
  });
}

/**
 * Retrieves a single field by its identifier.
 *
 * @param {string} fieldId Field UUID
 * @returns {Promise<Field>}
 * @throws {NotFoundError} If the field does not exist
 */
export async function getFieldById(fieldId) {
  const field = await Field.findByPk(fieldId);

  if (!field) {
    throw new NotFoundError("Field not found");
  }

  return field;
}

/**
 * Creates a booking for a sports field.
 *
 * Business rules:
 * - field must exist
 * - startTime and endTime must be valid dates
 * - endTime must be after startTime
 * - bookings cannot be made in the past
 * - overlapping bookings are not allowed
 *
 * Conflict prevention is enforced at database level
 * via a uniqueness constraint; violations are translated
 * into domain errors.
 *
 * @param {string} fieldId Field identifier
 * @param {Object} user Authenticated user (from JWT)
 * @param {Object} payload Booking data
 * @param {string} payload.startTime ISO date-time
 * @param {string} payload.endTime ISO date-time
 * @returns {Promise<FieldBooking>}
 */
export async function createBooking(fieldId, user, payload) {
  // Ensure field exists
  const field = await getFieldById(fieldId);

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);

  // Validate date presence and format
  if (
    !payload.startTime ||
    !payload.endTime ||
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime())
  ) {
    throw new ValidationError("Invalid startTime/endTime");
  }

  // Logical time interval check
  if (endTime <= startTime) {
    throw new ValidationError("endTime must be after startTime");
  }

  // Prevent bookings in the past
  if (startTime < new Date()) {
    throw new ValidationError("Cannot book a past time slot");
  }

  try {
    return await FieldBooking.create({
      fieldId: field.id,
      userId: user.id,
      startTime,
      endTime
    });
  } catch (err) {

    // Database constraint violation = overlapping booking
    throw new ConflictError("Time slot already booked");
  }
}

/**
 * Cancels an existing booking.
 *
 * Authorization rules:
 * - only the user who created the booking can cancel it
 *
 * Business rules:
 * - only future bookings can be cancelled
 *
 * @param {string} fieldId Field identifier
 * @param {string} bookingId Booking identifier
 * @param {Object} user Authenticated user
 * @returns {Promise<void>}
 */
export async function cancelBooking(fieldId, bookingId, user) {
  const booking = await FieldBooking.findOne({
    where: { id: bookingId, fieldId }
  });

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  // Ownership check
  if (booking.userId !== user.id) {
    throw new ForbiddenError("You can only cancel your own bookings");
  }

  // Prevent cancellation of past or ongoing bookings
  if (new Date(booking.startTime) <= new Date()) {
    throw new ValidationError("Only upcoming bookings can be cancelled");
  }

  await booking.destroy();
}
