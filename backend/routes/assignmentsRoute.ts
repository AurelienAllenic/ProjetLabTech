import express from "express";
import multer from "multer";
import {
  createAssignment,
  createAssignmentFromUpload,
  getAssignmentSignedUrl,
  listAssignments,
  listMyAssignments,
} from "../controllers/assignmentsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.use(requireAuth);

router.post("/", requireRole("laboratory"), createAssignment);
router.get("/", requireRole("laboratory"), listAssignments);
router.post(
  "/upload",
  requireRole("laboratory"),
  pdfUpload.single("pdf"),
  createAssignmentFromUpload
);

router.get("/mine", requireRole("client"), listMyAssignments);
router.get("/mine/:assignmentId/signed-url", requireRole("client"), getAssignmentSignedUrl);

export default router;
