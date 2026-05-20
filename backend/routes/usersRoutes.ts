import express from "express";
import { createClient, listUsers } from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("laboratory"), listUsers);
router.post("/", requireAuth, requireRole("laboratory"), createClient);
router.post("/clients", requireAuth, requireRole("laboratory"), createClient);

export default router;
