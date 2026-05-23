import mongoose from 'mongoose';
import { asyncHandler } from '../utils/async-handler.js';
import { Board, Folder } from '../models/index.js';
import { HttpError } from '../utils/errors.js';

export const listFolders = asyncHandler(async (req, res) => {
  const folders = await Folder.find({ ownerId: req.user.id }).sort({ name: 1 });
  const counts = await Board.aggregate([
    { $match: { ownerId: new mongoose.Types.ObjectId(req.user.id), deletedAt: null } },
    { $group: { _id: '$folderId', count: { $sum: 1 } } },
  ]);
  const countByFolder = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    items: folders.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      color: f.color,
      parentId: f.parentId ? f.parentId.toString() : null,
      boardCount: countByFolder.get(f._id.toString()) ?? 0,
      updatedAt: f.updatedAt,
    })),
  });
});

export const createFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.create({
    ownerId: req.user.id,
    name: req.body.name,
    color: req.body.color ?? null,
    parentId: req.body.parentId ?? null,
  });
  res.status(201).json({
    folder: {
      id: folder._id.toString(),
      name: folder.name,
      color: folder.color,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      boardCount: 0,
      updatedAt: folder.updatedAt,
    },
  });
});

export const updateFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!folder) throw HttpError.notFound('Folder not found');
  if (req.body.name !== undefined) folder.name = req.body.name;
  if (req.body.color !== undefined) folder.color = req.body.color;
  if (req.body.parentId !== undefined) folder.parentId = req.body.parentId;
  await folder.save();
  res.json({ folder: { id: folder._id.toString(), name: folder.name, color: folder.color } });
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  if (!folder) throw HttpError.notFound('Folder not found');
  // Promote direct child folders to root rather than orphaning them.
  await Folder.updateMany(
    { parentId: folder._id, ownerId: req.user.id },
    { $set: { parentId: null } },
  );
  // Detach boards rather than cascading delete.
  await Board.updateMany(
    { folderId: folder._id, ownerId: req.user.id },
    { $set: { folderId: null } },
  );
  res.status(204).end();
});
