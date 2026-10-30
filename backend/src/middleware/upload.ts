import multer from 'multer';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errors.js';

// Allowed MIME types for documents
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/webp',
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_UPLOAD_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPEG, TIFF, WEBP`
        )
      );
    }
  },
});

