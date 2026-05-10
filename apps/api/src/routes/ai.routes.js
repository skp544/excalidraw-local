import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiCapabilities, aiGenerate } from '../controllers/ai.controller.js';
import { aiGenerateSchema } from '@excalidrow/shared/schemas';

const router = Router();

router.use(requireAuth);

router.get('/capabilities', aiCapabilities);
router.post('/generate', validate({ body: aiGenerateSchema }), aiGenerate);

export default router;
