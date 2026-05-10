import mongoose from 'mongoose';
import argon2 from 'argon2';

const PreferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    defaultFont: {
      type: String,
      enum: ['Excalifont', 'Cascadia', 'Virgil', 'Helvetica', 'Inter'],
      default: 'Excalifont',
    },
    snapToGrid: { type: Boolean, default: false },
    showGrid: { type: Boolean, default: true },
    reduceMotion: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: null },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.methods.verifyPassword = function verifyPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return argon2.verify(this.passwordHash, plain);
};

UserSchema.statics.hashPassword = function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id });
};

UserSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model('User', UserSchema);
