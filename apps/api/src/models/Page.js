import mongoose from 'mongoose';

const SceneSchema = new mongoose.Schema(
  {
    elements: { type: mongoose.Schema.Types.Mixed, default: [] },
    appState: { type: mongoose.Schema.Types.Mixed, default: {} },
    files: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const VersionSchema = new mongoose.Schema(
  {
    label: { type: String, default: null },
    scene: { type: SceneSchema, required: true },
    createdAt: { type: Date, default: () => new Date() },
    bytes: { type: Number, default: 0 },
  },
  { _id: true },
);

const PageSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled page', maxlength: 80 },
    index: { type: Number, default: 0, index: true },
    scene: { type: SceneSchema, default: () => ({ elements: [], appState: {}, files: {} }) },
    /** Binary Yjs document state, stored base64-encoded. Optional: kept up
     *  to date alongside the JSON scene snapshot for CRDT-driven sync. */
    yDoc: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    /** Capped version history — newest first. The route layer trims it. */
    versions: { type: [VersionSchema], default: [] },
    elementCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

PageSchema.index({ boardId: 1, index: 1 });

PageSchema.methods.toSummary = function toSummary() {
  return {
    id: this._id.toString(),
    boardId: this.boardId.toString(),
    title: this.title,
    index: this.index,
    thumbnailUrl: this.thumbnailUrl,
    elementCount: this.elementCount,
    updatedAt: this.updatedAt,
  };
};

PageSchema.methods.toDetail = function toDetail() {
  return {
    ...this.toSummary(),
    scene: this.scene,
  };
};

export const Page = mongoose.model('Page', PageSchema);
