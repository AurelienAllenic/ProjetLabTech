import type { Request, Response, NextFunction } from "express";
import { PDFDocument } from "pdf-lib";

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

async function convertImageToPdf(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  const image =
    mimeType === "image/png"
      ? await pdfDoc.embedPng(imageBuffer)
      : await pdfDoc.embedJpg(imageBuffer);

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  return Buffer.from(await pdfDoc.save());
}

export async function imageToPdfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file || !IMAGE_MIME_TYPES.has(req.file.mimetype)) {
    next();
    return;
  }

  try {
    req.originalImageBuffer = req.file.buffer;
    req.originalImageMimeType = req.file.mimetype;

    req.file.buffer = await convertImageToPdf(req.file.buffer, req.file.mimetype);
    req.file.mimetype = "application/pdf";
    req.file.originalname = req.file.originalname.replace(/\.(png|jpe?g)$/i, ".pdf");

    next();
  } catch (err) {
    next(err);
  }
}
