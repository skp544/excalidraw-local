import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null, maxlength: 2000 },
    mode: {
      type: String,
      enum: ['free', 'kanban', 'mindmap', 'architecture', 'notes'],
      default: 'free',
      index: true,
    },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    tags: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    thumbnailUrl: { type: String, default: null },
    pageCount: { type: Number, default: 1 },
    lastOpenedAt: { type: Date, default: null },
    /** Soft-delete safety net so accidental deletes can be restored. */
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

BoardSchema.index({ ownerId: 1, updatedAt: -1 });
BoardSchema.index({ ownerId: 1, isFavorite: 1, updatedAt: -1 });
BoardSchema.index({ ownerId: 1, title: 'text', description: 'text', tags: 'text' });

BoardSchema.methods.toSummary = function toSummary() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    mode: this.mode,
    folderId: this.folderId ? this.folderId.toString() : null,
    tags: this.tags,
    isFavorite: this.isFavorite,
    isArchived: this.isArchived,
    thumbnailUrl: this.thumbnailUrl,
    pageCount: this.pageCount,
    lastOpenedAt: this.lastOpenedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Board = mongoose.model('Board', BoardSchema);
