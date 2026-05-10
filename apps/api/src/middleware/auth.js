import { HttpError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw HttpError.unauthorized('Missing access token');
    }
    const token = header.slice('Bearer '.length).trim();
    const payload = verifyAccessToken(token);
    if (payload.typ !== 'access') throw HttpError.unauthorized('Invalid token type');
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      next(HttpError.unauthorized('Access token expired'));
      return;
    }
    if (err && err.name === 'JsonWebTokenError') {
      next(HttpError.unauthorized('Invalid access token'));
      return;
    }
    next(err);
  }
}
