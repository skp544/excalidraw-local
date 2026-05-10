import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  exportBoardJson,
  importBoardJson,
  saveExport,
} from '../controllers/export.controller.js';
import { exportRequestSchema } from '@excalidrow/shared/schemas';

const router = Router();

router.use(requireAuth);

router.post('/save', validate({ body: exportRequestSchema.passthrough() }), saveExport);
router.get('/board/:id/json', exportBoardJson);
router.post('/import', importBoardJson);

export default router;
