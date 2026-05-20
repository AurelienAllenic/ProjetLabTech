import express from "express";
import multer from "multer";
import { createAssignment, createAssignmentFromUpload, getAssignmentSignedUrl, listAssignments, listMyAssignments, } from "../controllers/assignmentsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
const router = express.Router();
const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
});
router.use(requireAuth);
router.post("/", requireRole("labo"), createAssignment);
router.get("/", requireRole("labo"), listAssignments);
router.post("/upload", requireRole("labo"), pdfUpload.single("pdf"), createAssignmentFromUpload);
router.get("/mine", requireRole("userLabo"), listMyAssignments);
router.get("/mine/:assignmentId/signed-url", requireRole("userLabo"), getAssignmentSignedUrl);
export default router;
