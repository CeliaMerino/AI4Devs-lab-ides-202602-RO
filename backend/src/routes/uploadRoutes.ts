import path from 'path';
import { Router } from 'express';
import { createUploadMiddleware } from '../middleware/uploadMiddleware';
import { uploadResume } from '../presentation/controllers/uploadController';

function resolveUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
}

const uploadDir = resolveUploadDir();
const upload = createUploadMiddleware(uploadDir);

const router = Router();
router.post('/upload', upload.single('file'), uploadResume);

export { router as uploadRoutes };
