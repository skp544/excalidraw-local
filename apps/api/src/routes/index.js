import { Router } from 'express';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import folderRoutes from './folder.routes.js';
import activityRoutes from './activity.routes.js';
import uploadRoutes from './upload.routes.js';
import exportRoutes from './export.routes.js';
import aiRoutes from './ai.routes.js';
import snippetRoutes from './snippet.routes.js';

/**
 * API v1 router. All future versions can mount under /api/v2 etc.
 */
const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, version: 1 }));

router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/folders', folderRoutes);
router.use('/activity', activityRoutes);
router.use('/uploads', uploadRoutes);
router.use('/export', exportRoutes);
router.use('/ai', aiRoutes);
router.use('/snippets', snippetRoutes);

export default router;
