import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rate-limit.js';
import {
  deleteAsset,
  listAssets,
  uploadImage,
} from '../controllers/upload.controller.js';
import { env } from '../config/env.js';
import { generateStorageName, diskPathFor } from '../services/storage.service.js';
import { HttpError } from '../utils/errors.js';

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, diskPathFor('image', '').replace(/[\\/]+$/, '')),
  filename: (_req, file, cb) => cb(null, generateStorageName(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(HttpError.badRequest(`Unsupported media type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(requireAuth, uploadLimiter);

router.get('/', listAssets);
router.post('/image', upload.single('file'), uploadImage);
router.delete('/:id', deleteAsset);

export default router;
