import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  boardCreateSchema,
  boardListQuerySchema,
  boardUpdateSchema,
  noteUpdateSchema,
  pageCreateSchema,
  pageUpdateSchema,
} from '@excalidrow/shared/schemas';
import {
  createBoard,
  deleteBoard,
  duplicateBoard,
  getBoard,
  listBoards,
  saveNoteContent,
  toggleFavorite,
  updateBoard,
  uploadBoardThumbnail,
} from '../controllers/board.controller.js';
import {
  createPage,
  deletePage,
  getPage,
  listPages,
  listVersions,
  reorderPages,
  restoreVersion,
  updatePage,
} from '../controllers/page.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: boardListQuerySchema }), listBoards);
router.post('/', validate({ body: boardCreateSchema }), createBoard);
router.get('/:id', getBoard);
router.patch('/:id', validate({ body: boardUpdateSchema }), updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/favorite', toggleFavorite);
router.patch('/:id/note', validate({ body: noteUpdateSchema }), saveNoteContent);
router.post('/:id/duplicate', duplicateBoard);
router.post('/:id/thumbnail', uploadBoardThumbnail);

// pages nested under boards
router.get('/:boardId/pages', listPages);
router.post('/:boardId/pages', validate({ body: pageCreateSchema }), createPage);
router.post('/:boardId/pages/reorder', reorderPages);
router.get('/:boardId/pages/:pageId', getPage);
router.patch('/:boardId/pages/:pageId', validate({ body: pageUpdateSchema }), updatePage);
router.delete('/:boardId/pages/:pageId', deletePage);
router.get('/:boardId/pages/:pageId/versions', listVersions);
router.post('/:boardId/pages/:pageId/versions/:versionId/restore', restoreVersion);

export default router;
