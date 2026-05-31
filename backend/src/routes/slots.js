/**
 * @file slots.js
 * @description Computes available booking slots for a sports field on a given date.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as slotService from "../services/slotService.js";

// Router handling available booking slot computation
export const slotsRouter = express.Router();

// Retrieve available booking slots for a field on a specific date
slotsRouter.get(
  "/fields/:id/slots",
  asyncHandler(async (req, res) => {

    // The date parameter is expected as a query string (YYYY-MM-DD)
    const slots = await slotService.getFieldSlots(req.params.id, String(req.query.date ?? ""));
    res.json(slots);
  })
);
