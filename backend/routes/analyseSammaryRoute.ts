import express from "express";
import multer from "multer";
import { analysePdf } from "../controllers/anlyseController.js";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("pdf"), analysePdf);

export default router;
