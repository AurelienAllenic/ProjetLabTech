import express from "express";
import { createUser, listUsers } from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

router.use(requireAuth, requireRole("labo"));
router.post("/", createUser);
router.get("/", listUsers);

export default router;
