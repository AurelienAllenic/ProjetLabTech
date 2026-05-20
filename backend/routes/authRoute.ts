import express from "express";
import { login, me, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/reset-password", resetPassword);

export default router;
