import mongoose from 'mongoose';

/**
 * Stores the active refresh tokens per user. Tokens are rotated on every
 * /auth/refresh call: we mark the previous one revoked and chain a new one.
 * Reuse of a revoked token implies leakage and triggers full session purge.
 */
const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    userAgent: { type: String, default: null, maxlength: 256 },
    ip: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true, versionKey: false },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
