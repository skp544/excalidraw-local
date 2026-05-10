import { nanoid } from 'nanoid';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { HttpError } from '../utils/errors.js';
import {
  decodeExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

function expiryDateFromToken(token) {
  const iso = decodeExpiry(token);
  return iso ? new Date(iso) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

async function issueTokenPair(user, context) {
  const accessToken = signAccessToken(user._id, { name: user.name, email: user.email });
  const jti = nanoid(24);
  const refreshToken = signRefreshToken(user._id, jti);
  await RefreshToken.create({
    userId: user._id,
    jti,
    expiresAt: expiryDateFromToken(refreshToken),
    userAgent: context.userAgent ?? null,
    ip: context.ip ?? null,
  });
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: decodeExpiry(accessToken),
    refreshTokenExpiresAt: decodeExpiry(refreshToken),
  };
}

export async function registerUser({ name, email, password }, context = {}) {
  const exists = await User.exists({ email });
  if (exists) throw HttpError.conflict('An account with this email already exists');
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  const tokens = await issueTokenPair(user, context);
  return { user: user.toPublic(), tokens };
}

export async function loginUser({ email, password }, context = {}) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw HttpError.unauthorized('Invalid credentials');
  const ok = await user.verifyPassword(password);
  if (!ok) throw HttpError.unauthorized('Invalid credentials');
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokenPair(user, context);
  return { user: user.toPublic(), tokens };
}

export async function rotateRefreshToken(rawRefreshToken, context = {}) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw HttpError.unauthorized('Invalid refresh token');
  }
  if (payload.typ !== 'refresh' || !payload.jti) {
    throw HttpError.unauthorized('Invalid refresh token');
  }

  const stored = await RefreshToken.findOne({ jti: payload.jti, userId: payload.sub });
  if (!stored) throw HttpError.unauthorized('Refresh token not recognized');

  if (stored.revokedAt) {
    // Reuse of a revoked token implies leakage — invalidate the entire family.
    await RefreshToken.updateMany(
      { userId: payload.sub, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw HttpError.unauthorized('Refresh token reuse detected');
  }
  if (stored.expiresAt.getTime() <= Date.now()) {
    throw HttpError.unauthorized('Refresh token expired');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw HttpError.unauthorized('User no longer exists');

  const newJti = nanoid(24);
  const newRefreshToken = signRefreshToken(user._id, newJti);
  const newAccessToken = signAccessToken(user._id, { name: user.name, email: user.email });

  stored.revokedAt = new Date();
  stored.replacedBy = newJti;
  await stored.save();

  await RefreshToken.create({
    userId: user._id,
    jti: newJti,
    expiresAt: expiryDateFromToken(newRefreshToken),
    userAgent: context.userAgent ?? null,
    ip: context.ip ?? null,
  });

  return {
    user: user.toPublic(),
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresAt: decodeExpiry(newAccessToken),
      refreshTokenExpiresAt: decodeExpiry(newRefreshToken),
    },
  };
}

export async function revokeRefreshToken(rawRefreshToken) {
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    if (payload?.jti) {
      await RefreshToken.updateOne({ jti: payload.jti }, { $set: { revokedAt: new Date() } });
    }
  } catch {
    /* ignore — already invalid */
  }
}

export async function revokeAllSessions(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
