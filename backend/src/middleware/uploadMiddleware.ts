import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { ValidationError } from '../domain/errors';

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function createUploadMiddleware(uploadDir: string): multer.Multer {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ext === '.pdf' || ext === '.docx' ? ext : '';
      cb(null, `${randomUUID()}${safeExt || path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        cb(new ValidationError('Only PDF and DOCX files are allowed'));
        return;
      }
      cb(null, true);
    },
  });
}
