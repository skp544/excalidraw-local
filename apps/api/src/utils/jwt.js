import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ACCESS_OPTS = { expiresIn: env.JWT_ACCESS_TTL, issuer: 'excalidrow', audience: 'web' };
const REFRESH_OPTS = { expiresIn: env.JWT_REFRESH_TTL, issuer: 'excalidrow', audience: 'refresh' };

export function signAccessToken(userId, payload = {}) {
  return jwt.sign({ ...payload, sub: String(userId), typ: 'access' }, env.JWT_ACCESS_SECRET, ACCESS_OPTS);
}

export function signRefreshToken(userId, jti) {
  return jwt.sign(
    { sub: String(userId), jti, typ: 'refresh' },
    env.JWT_REFRESH_SECRET,
    REFRESH_OPTS,
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'excalidrow', audience: 'web' });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'excalidrow', audience: 'refresh' });
}

export function decodeExpiry(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string' || !decoded.exp) return null;
  return new Date(decoded.exp * 1000).toISOString();
}
