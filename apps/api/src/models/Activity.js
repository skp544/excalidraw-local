import mongoose from 'mongoose';
import { ACTIVITY_KINDS } from '@excalidrow/shared/constants';

const ActivitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ACTIVITY_KINDS, required: true, index: true },
    targetKind: {
      type: String,
      enum: ['board', 'page', 'asset', 'user', 'auth'],
      default: null,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    message: { type: String, required: true, maxlength: 400 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

ActivitySchema.index({ actorId: 1, createdAt: -1 });

ActivitySchema.methods.toJSONResponse = function toJSONResponse() {
  return {
    id: this._id.toString(),
    actorId: this.actorId.toString(),
    kind: this.kind,
    targetKind: this.targetKind,
    targetId: this.targetId ? this.targetId.toString() : null,
    message: this.message,
    metadata: this.metadata,
    createdAt: this.createdAt,
  };
};

export const Activity = mongoose.model('Activity', ActivitySchema);
