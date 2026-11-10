import type { Request } from "express";
import multer from "multer";
import { BadRequestError } from "../../application/errors/app-error";
import type { ImageFile } from "../../application/ports/image-storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

/** Recibe un solo archivo en el campo "image", en memoria, para luego subirlo a Supabase. */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      callback(new BadRequestError("La imagen debe ser JPG, PNG, WebP o GIF."));
      return;
    }
    callback(null, true);
  },
}).single("image");

export function getImageFile(req: Request): ImageFile | undefined {
  if (!req.file) {
    return undefined;
  }
  return { buffer: req.file.buffer, mimetype: req.file.mimetype, originalName: req.file.originalname };
}

export const MAX_IMAGE_SIZE_MB = MAX_SIZE_MB;
