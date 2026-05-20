import express from "express";
import { createAssignment, listAssignments } from "../controllers/assignmentsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
const router = express.Router();
router.use(requireAuth, requireRole("labo"));
router.post("/", createAssignment);
router.get("/", listAssignments);
export default router;
