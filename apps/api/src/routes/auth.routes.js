import { Router } from 'express';
import {
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  updateMe,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateUserSchema,
} from '@excalidrow/shared/schemas';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', authLimiter, validate({ body: refreshSchema }), refresh);
router.post('/logout', logout);

router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validate({ body: updateUserSchema }), updateMe);
router.post('/logout-all', requireAuth, logoutAll);

export default router;
