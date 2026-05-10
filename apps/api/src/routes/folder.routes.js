import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  folderCreateSchema,
  folderUpdateSchema,
} from '@excalidrow/shared/schemas';
import {
  createFolder,
  deleteFolder,
  listFolders,
  updateFolder,
} from '../controllers/folder.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listFolders);
router.post('/', validate({ body: folderCreateSchema }), createFolder);
router.patch('/:id', validate({ body: folderUpdateSchema }), updateFolder);
router.delete('/:id', deleteFolder);

export default router;
