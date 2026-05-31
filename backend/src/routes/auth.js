/**
 * @file auth.js
 * @description User signup and signin routes.
 *
 * These routes are public and do not require authentication,
 * since they are used to create or authenticate users.
 */

import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

// Router handling authentication-related endpoints
export const authRouter = express.Router();

// Handle CORS preflight requests
authRouter.options("*", (_req, res) => res.sendStatus(204));

// User registration endpoint
authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {

    // Delegate user creation logic to the authentication service
    const user = await authService.signup(req.body);
    res.status(201).json(user);
  })
);

// User authentication endpoint
authRouter.post(
  "/signin",
  asyncHandler(async (req, res) => {

    // Delegate credential verification and token generation to the service
    const result = await authService.signin(req.body);
    res.json(result);
  })
);
