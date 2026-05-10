import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    color: { type: String, default: null, maxlength: 20 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  },
  { timestamps: true, versionKey: false },
);

FolderSchema.index({ ownerId: 1, name: 1 });

export const Folder = mongoose.model('Folder', FolderSchema);
