import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { safeFilename } from '@excalidrow/shared/utils';

const KIND_DIR = {
  image: 'images',
  export: 'exports',
  thumbnail: 'thumbnails',
  board: 'boards',
};

export async function ensureStorageDirs() {
  await Promise.all(
    Object.values(KIND_DIR).map((dir) =>
      fs.mkdir(path.join(env.UPLOAD_ROOT, dir), { recursive: true }),
    ),
  );
}

export function publicUrlFor(kind, filename) {
  const dir = KIND_DIR[kind];
  if (!dir) throw new Error(`unknown asset kind: ${kind}`);
  return `/uploads/${dir}/${filename}`;
}

export function diskPathFor(kind, filename) {
  const dir = KIND_DIR[kind];
  if (!dir) throw new Error(`unknown asset kind: ${kind}`);
  return path.join(env.UPLOAD_ROOT, dir, filename);
}

export function generateStorageName(originalName) {
  const ext = path.extname(originalName).toLowerCase().slice(0, 8);
  const id = crypto.randomBytes(12).toString('hex');
  const stem = safeFilename(path.basename(originalName, ext)).slice(0, 60) || 'file';
  return `${Date.now()}-${id}-${stem}${ext}`;
}

export async function sha256File(filepath) {
  const buf = await fs.readFile(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Generate a 320px-wide thumbnail for an image upload. Returns the path on
 * disk + the public url + intrinsic dimensions of the source image.
 */
export async function generateImageThumbnail(diskPath, baseFilename) {
  const thumbName = `thumb-${baseFilename}.webp`;
  const thumbDisk = diskPathFor('thumbnail', thumbName);
  const meta = await sharp(diskPath).metadata();
  await sharp(diskPath)
    .rotate()
    .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbDisk);
  return {
    thumbnailPath: thumbDisk,
    thumbnailUrl: publicUrlFor('thumbnail', thumbName),
    width: meta.width ?? null,
    height: meta.height ?? null,
  };
}

/** Persist a base64 PNG (board thumbnail captured by the editor). */
export async function saveBoardThumbnail(boardId, dataUrl) {
  const match = /^data:image\/(png|webp|jpeg);base64,(.+)$/.exec(dataUrl ?? '');
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buf = Buffer.from(match[2], 'base64');
  const filename = `board-${boardId}-${Date.now()}.${ext}`;
  const diskPath = diskPathFor('thumbnail', filename);
  await fs.writeFile(diskPath, buf);
  return { url: publicUrlFor('thumbnail', filename), filename, diskPath };
}

export async function deleteAssetFiles({ storagePath, thumbnailPath }) {
  await Promise.allSettled([
    storagePath ? fs.unlink(storagePath) : null,
    thumbnailPath ? fs.unlink(thumbnailPath) : null,
  ]);
}

export const STORAGE_KIND_DIR = KIND_DIR;
