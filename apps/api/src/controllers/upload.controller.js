import { asyncHandler } from '../utils/async-handler.js';
import { Asset } from '../models/Asset.js';
import { HttpError } from '../utils/errors.js';
import {
  generateImageThumbnail,
  publicUrlFor,
  sha256File,
  diskPathFor,
  deleteAssetFiles,
} from '../services/storage.service.js';
import { logActivity } from '../services/activity.service.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw HttpError.badRequest('No file uploaded');
  const isImage = req.file.mimetype.startsWith('image/');
  let width = null;
  let height = null;
  let thumbnailUrl = null;
  let thumbnailPath = null;

  if (isImage) {
    const thumb = await generateImageThumbnail(req.file.path, req.file.filename);
    width = thumb.width;
    height = thumb.height;
    thumbnailUrl = thumb.thumbnailUrl;
    thumbnailPath = thumb.thumbnailPath;
  }
  const sha256 = await sha256File(req.file.path);

  const asset = await Asset.create({
    ownerId: req.user.id,
    boardId: req.body.boardId || null,
    kind: 'image',
    filename: req.file.originalname,
    storagePath: req.file.path,
    mimeType: req.file.mimetype,
    size: req.file.size,
    publicUrl: publicUrlFor('image', req.file.filename),
    thumbnailUrl,
    thumbnailPath,
    width,
    height,
    sha256,
  });

  await logActivity({
    actorId: req.user.id,
    kind: 'asset.uploaded',
    message: `Uploaded ${asset.filename}`,
    targetKind: 'asset',
    targetId: asset._id,
  });

  res.status(201).json({ asset: asset.toSummary() });
});

export const listAssets = asyncHandler(async (req, res) => {
  const items = await Asset.find({ ownerId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ items: items.map((a) => a.toSummary()) });
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  if (!asset) throw HttpError.notFound('Asset not found');
  await deleteAssetFiles({
    storagePath: asset.storagePath,
    thumbnailPath: asset.thumbnailPath,
  });
  res.status(204).end();
});

export { diskPathFor };
