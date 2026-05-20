import express from "express";
import multer from "multer";
import { analysePdf } from "../controllers/anlyseController.js";
import { imageToPdfMiddleware } from "../middlewares/imageToPdfMiddleware.js";
const router = express.Router();
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const upload = multer({
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Format non supporté. Veuillez envoyer un PDF ou une image (PNG, JPG)."));
        }
    },
});
router.post("/", upload.single("pdf"), imageToPdfMiddleware, analysePdf);
export default router;
