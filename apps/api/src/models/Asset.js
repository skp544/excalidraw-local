import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null, index: true },
    kind: {
      type: String,
      enum: ['image', 'export', 'thumbnail', 'board'],
      required: true,
      index: true,
    },
    filename: { type: String, required: true },
    storagePath: { type: String, required: true }, // path on disk relative to UPLOAD_ROOT
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    thumbnailPath: { type: String, default: null },
    publicUrl: { type: String, required: true }, // /uploads/<kind>/<file>
    thumbnailUrl: { type: String, default: null },
    sha256: { type: String, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

AssetSchema.methods.toSummary = function toSummary() {
  return {
    id: this._id.toString(),
    ownerId: this.ownerId.toString(),
    boardId: this.boardId ? this.boardId.toString() : null,
    kind: this.kind,
    filename: this.filename,
    mimeType: this.mimeType,
    size: this.size,
    width: this.width,
    height: this.height,
    url: this.publicUrl,
    thumbnailUrl: this.thumbnailUrl,
    createdAt: this.createdAt,
  };
};

export const Asset = mongoose.model('Asset', AssetSchema);
