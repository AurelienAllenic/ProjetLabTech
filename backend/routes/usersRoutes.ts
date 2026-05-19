import express from "express";
import { createClient } from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

router.post("/clients", requireAuth, requireRole("laboratory"), createClient);

export default router;
