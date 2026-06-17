import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { snippetCreateSchema } from '@excalidrow/shared/schemas';
import {
  listSnippets, createSnippet, updateSnippet, deleteSnippet,
} from '../controllers/snippet.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listSnippets);
router.post('/', validate({ body: snippetCreateSchema }), createSnippet);
router.patch('/:id', validate({ body: snippetCreateSchema.partial() }), updateSnippet);
router.delete('/:id', deleteSnippet);

export default router;
