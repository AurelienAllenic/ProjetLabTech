import type { Request, Response, NextFunction } from "express";

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

export function imageToPdfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.file || !IMAGE_MIME_TYPES.has(req.file.mimetype)) {
    next();
    return;
  }

  req.originalImageBuffer = req.file.buffer;
  req.originalImageMimeType = req.file.mimetype;
  next();
}
