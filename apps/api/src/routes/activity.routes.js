import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listActivity,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/activity.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listActivity);
router.get('/notifications', listNotifications);
router.post('/notifications/read-all', markAllNotificationsRead);
router.post('/notifications/:id/read', markNotificationRead);

export default router;
