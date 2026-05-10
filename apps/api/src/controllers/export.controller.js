import fs from 'node:fs/promises';
import path from 'node:path';
import { asyncHandler } from '../utils/async-handler.js';
import { Board, Page, Asset } from '../models/index.js';
import { HttpError } from '../utils/errors.js';
import {
  publicUrlFor,
  diskPathFor,
  generateStorageName,
} from '../services/storage.service.js';
import { logActivity } from '../services/activity.service.js';

const ALLOWED_EXPORT_KINDS = new Set(['png', 'svg', 'pdf', 'json']);

/**
 * Persist a base64 / utf8 export blob produced by the editor into the local
 * exports directory and return a public URL the client can download from.
 *
 * The actual rendering of PNG / SVG / PDF happens in the browser using the
 * Excalidraw library (`exportToBlob`, `exportToSvg`, jsPDF). The server is
 * deliberately a dumb sink so we never need a headless Chromium or canvas.
 */
export const saveExport = asyncHandler(async (req, res) => {
  const { boardId, format } = req.body;
  if (!ALLOWED_EXPORT_KINDS.has(format)) throw HttpError.badRequest('Unsupported format');
  const board = await Board.findOne({ _id: boardId, ownerId: req.user.id, deletedAt: null });
  if (!board) throw HttpError.notFound('Board not found');

  let buffer;
  let mimeType;
  if (format === 'json' || format === 'svg') {
    if (typeof req.body.payload !== 'string') throw HttpError.badRequest('Missing payload');
    buffer = Buffer.from(req.body.payload, 'utf8');
    mimeType = format === 'json' ? 'application/json' : 'image/svg+xml';
  } else {
    if (typeof req.body.dataUrl !== 'string') throw HttpError.badRequest('Missing dataUrl');
    const m = /^data:([^;]+);base64,(.+)$/.exec(req.body.dataUrl);
    if (!m) throw HttpError.badRequest('Invalid dataUrl');
    mimeType = m[1];
    buffer = Buffer.from(m[2], 'base64');
  }

  const filename = generateStorageName(`${board.title}-${board._id}.${format}`);
  const diskPath = diskPathFor('export', filename);
  await fs.writeFile(diskPath, buffer);

  const asset = await Asset.create({
    ownerId: req.user.id,
    boardId: board._id,
    kind: 'export',
    filename: path.basename(filename),
    storagePath: diskPath,
    mimeType,
    size: buffer.byteLength,
    publicUrl: publicUrlFor('export', filename),
  });

  await logActivity({
    actorId: req.user.id,
    kind: 'board.exported',
    message: `Exported "${board.title}" as ${format.toUpperCase()}`,
    targetKind: 'board',
    targetId: board._id,
    metadata: { format, assetId: asset._id.toString() },
  });

  res.status(201).json({ asset: asset.toSummary() });
});

export const exportBoardJson = asyncHandler(async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, ownerId: req.user.id, deletedAt: null });
  if (!board) throw HttpError.notFound('Board not found');
  const pages = await Page.find({ boardId: board._id }).sort({ index: 1 });
  res.json({
    schema: 'excalidrow.board.v1',
    exportedAt: new Date().toISOString(),
    board: {
      title: board.title,
      description: board.description,
      mode: board.mode,
      tags: board.tags,
    },
    pages: pages.map((p) => ({
      title: p.title,
      index: p.index,
      scene: p.scene,
    })),
  });
});

export const importBoardJson = asyncHandler(async (req, res) => {
  const { board: boardData, pages: pagesData } = req.body ?? {};
  if (!boardData || !Array.isArray(pagesData) || pagesData.length === 0) {
    throw HttpError.badRequest('Invalid import payload');
  }
  const board = await Board.create({
    ownerId: req.user.id,
    title: String(boardData.title ?? 'Imported board').slice(0, 120),
    description: boardData.description ?? null,
    mode: boardData.mode ?? 'free',
    tags: Array.isArray(boardData.tags) ? boardData.tags.slice(0, 16) : [],
    pageCount: pagesData.length,
  });
  const pages = await Page.insertMany(
    pagesData.slice(0, 64).map((p, idx) => ({
      boardId: board._id,
      ownerId: req.user.id,
      title: String(p.title ?? `Page ${idx + 1}`).slice(0, 80),
      index: idx,
      scene: {
        elements: Array.isArray(p?.scene?.elements) ? p.scene.elements : [],
        appState: p?.scene?.appState ?? {},
        files: p?.scene?.files ?? {},
      },
    })),
  );
  await logActivity({
    actorId: req.user.id,
    kind: 'board.imported',
    message: `Imported "${board.title}"`,
    targetKind: 'board',
    targetId: board._id,
  });
  res.status(201).json({
    board: board.toSummary(),
    pages: pages.map((p) => p.toSummary()),
  });
});
