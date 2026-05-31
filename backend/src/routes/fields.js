/**
 * @file fields.js
 * @description Sports fields list, details and booking management.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as fieldService from "../services/fieldService.js";

// Router handling sports fields and related bookings
export const fieldsRouter = express.Router();

// List available sports fields (optionally filtered by sport)
fieldsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const fields = await fieldService.listFields({
      sport: req.query.sport,
      q: req.query.q,
    });
    res.json(fields);
  })
);

// Retrieve details of a specific field
fieldsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const field = await fieldService.getFieldById(req.params.id);
    res.json(field);
  })
);

// Create a new booking for a field (authentication required)
fieldsRouter.post(
  "/:id/bookings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const booking = await fieldService.createBooking(req.params.id, req.user, req.body);
    res.status(201).json(booking);
  })
);

// Cancel an existing field booking (authentication required)
fieldsRouter.delete(
  "/:id/bookings/:bookingId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await fieldService.cancelBooking(req.params.id, req.params.bookingId, req.user);
    res.status(204).send();
  })
);
