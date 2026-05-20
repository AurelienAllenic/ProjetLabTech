import express from "express";
import { me } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

router.get("/me", requireAuth, me);

export default router;
