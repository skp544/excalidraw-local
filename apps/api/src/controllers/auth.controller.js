import { asyncHandler } from '../utils/async-handler.js';
import {
  loginUser,
  registerUser,
  revokeAllSessions,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../services/auth.service.js';
import { logActivity } from '../services/activity.service.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/errors.js';

const ctxFromReq = (req) => ({
  userAgent: req.headers['user-agent']?.toString().slice(0, 256) ?? null,
  ip: req.ip,
});

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body, ctxFromReq(req));
  await logActivity({
    actorId: result.user.id,
    kind: 'auth.register',
    message: `Account created for ${result.user.email}`,
    targetKind: 'user',
    targetId: result.user.id,
  });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body, ctxFromReq(req));
  await logActivity({
    actorId: result.user.id,
    kind: 'auth.login',
    message: 'Signed in',
    targetKind: 'user',
    targetId: result.user.id,
  });
  res.json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await rotateRefreshToken(req.body.refreshToken, ctxFromReq(req));
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  if (req.body?.refreshToken) {
    await revokeRefreshToken(req.body.refreshToken);
  }
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw HttpError.unauthorized('User not found');
  res.json({ user: user.toPublic() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw HttpError.unauthorized('User not found');
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl;
  if (req.body.preferences) {
    user.preferences = { ...user.preferences.toObject(), ...req.body.preferences };
  }
  await user.save();
  res.json({ user: user.toPublic() });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessions(req.user.id);
  res.status(204).end();
});
