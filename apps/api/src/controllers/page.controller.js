import mongoose from 'mongoose';
import { asyncHandler } from '../utils/async-handler.js';
import { Board, Page } from '../models/index.js';
import { HttpError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';

const VERSION_LIMIT = 25;

async function getBoardForUser(boardId, userId) {
  if (!mongoose.isValidObjectId(boardId)) throw HttpError.notFound('Board not found');
  const board = await Board.findOne({ _id: boardId, ownerId: userId, deletedAt: null });
  if (!board) throw HttpError.notFound('Board not found');
  return board;
}

export const listPages = asyncHandler(async (req, res) => {
  const board = await getBoardForUser(req.params.boardId, req.user.id);
  const pages = await Page.find({ boardId: board._id })
    .select('-versions -scene')
    .sort({ index: 1 });
  res.json({ items: pages.map((p) => p.toSummary()) });
});

export const getPage = asyncHandler(async (req, res) => {
  await getBoardForUser(req.params.boardId, req.user.id);
  const page = await Page.findOne({ _id: req.params.pageId, boardId: req.params.boardId });
  if (!page) throw HttpError.notFound('Page not found');
  res.json({ page: page.toDetail() });
});

export const createPage = asyncHandler(async (req, res) => {
  const board = await getBoardForUser(req.params.boardId, req.user.id);
  const last = await Page.findOne({ boardId: board._id }).sort({ index: -1 });
  const index = req.body.index ?? (last ? last.index + 1 : 0);
  const page = await Page.create({
    boardId: board._id,
    ownerId: req.user.id,
    title: req.body.title || `Page ${index + 1}`,
    index,
  });
  board.pageCount = await Page.countDocuments({ boardId: board._id });
  await board.save();
  await logActivity({
    actorId: req.user.id,
    kind: 'page.created',
    message: `New page in "${board.title}"`,
    targetKind: 'page',
    targetId: page._id,
    metadata: { boardId: board._id.toString() },
  });
  res.status(201).json({ page: page.toDetail() });
});

export const updatePage = asyncHandler(async (req, res) => {
  const board = await getBoardForUser(req.params.boardId, req.user.id);
  const page = await Page.findOne({ _id: req.params.pageId, boardId: board._id });
  if (!page) throw HttpError.notFound('Page not found');

  if (req.body.title !== undefined) page.title = req.body.title;
  if (req.body.index !== undefined) page.index = req.body.index;
  if (req.body.thumbnailUrl !== undefined) page.thumbnailUrl = req.body.thumbnailUrl;
  if (req.body.scene) {
    // Capture a checkpoint snapshot before replacing scene, but only if the
    // diff is non-trivial — many autosaves arrive seconds apart.
    const last = page.versions[0];
    const elements = req.body.scene.elements ?? [];
    const nextBytes = Buffer.byteLength(JSON.stringify(elements));
    if (!last || nextBytes - (last.bytes ?? 0) > 4_096) {
      page.versions.unshift({
        scene: page.scene,
        createdAt: new Date(),
        bytes: nextBytes,
      });
      if (page.versions.length > VERSION_LIMIT) {
        page.versions = page.versions.slice(0, VERSION_LIMIT);
      }
    }
    page.scene = {
      elements,
      appState: req.body.scene.appState ?? {},
      files: req.body.scene.files ?? {},
    };
    page.elementCount = elements.length;
  }
  await page.save();
  res.json({ page: page.toDetail() });
});

export const deletePage = asyncHandler(async (req, res) => {
  const board = await getBoardForUser(req.params.boardId, req.user.id);
  const remaining = await Page.countDocuments({ boardId: board._id });
  if (remaining <= 1) throw HttpError.badRequest('A board must keep at least one page');
  const page = await Page.findOneAndDelete({ _id: req.params.pageId, boardId: board._id });
  if (!page) throw HttpError.notFound('Page not found');
  board.pageCount = await Page.countDocuments({ boardId: board._id });
  await board.save();
  res.status(204).end();
});

export const reorderPages = asyncHandler(async (req, res) => {
  const board = await getBoardForUser(req.params.boardId, req.user.id);
  const order = Array.isArray(req.body?.order) ? req.body.order : [];
  if (!order.length) throw HttpError.badRequest('order array is required');
  const ops = order.map((id, idx) => ({
    updateOne: {
      filter: { _id: id, boardId: board._id },
      update: { $set: { index: idx } },
    },
  }));
  await Page.bulkWrite(ops);
  res.json({ ok: true });
});

export const listVersions = asyncHandler(async (req, res) => {
  await getBoardForUser(req.params.boardId, req.user.id);
  const page = await Page.findOne({ _id: req.params.pageId, boardId: req.params.boardId })
    .select('versions');
  if (!page) throw HttpError.notFound('Page not found');
  res.json({
    items: page.versions.map((v) => ({
      id: v._id.toString(),
      label: v.label,
      createdAt: v.createdAt,
      bytes: v.bytes,
    })),
  });
});

export const restoreVersion = asyncHandler(async (req, res) => {
  await getBoardForUser(req.params.boardId, req.user.id);
  const page = await Page.findOne({ _id: req.params.pageId, boardId: req.params.boardId });
  if (!page) throw HttpError.notFound('Page not found');
  const version = page.versions.id(req.params.versionId);
  if (!version) throw HttpError.notFound('Version not found');
  // Capture current state as a new version, then swap in the restored scene.
  page.versions.unshift({
    scene: page.scene,
    createdAt: new Date(),
    bytes: Buffer.byteLength(JSON.stringify(page.scene?.elements ?? [])),
    label: 'before-restore',
  });
  page.scene = version.scene;
  page.elementCount = (version.scene?.elements ?? []).length;
  if (page.versions.length > VERSION_LIMIT) {
    page.versions = page.versions.slice(0, VERSION_LIMIT);
  }
  await page.save();
  res.json({ page: page.toDetail() });
});
