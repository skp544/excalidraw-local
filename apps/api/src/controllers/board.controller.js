import mongoose from 'mongoose';
import { asyncHandler } from '../utils/async-handler.js';
import { Board, Page, Folder } from '../models/index.js';
import { HttpError } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';
import { saveBoardThumbnail } from '../services/storage.service.js';

async function getOwnedBoard(boardId, userId) {
  if (!mongoose.isValidObjectId(boardId)) throw HttpError.notFound('Board not found');
  const board = await Board.findOne({ _id: boardId, ownerId: userId, deletedAt: null });
  if (!board) throw HttpError.notFound('Board not found');
  return board;
}

export const listBoards = asyncHandler(async (req, res) => {
  const { page, pageSize, search, folderId, favorite, archived, sortBy, sortDir } = req.query;
  const filter = {
    ownerId: req.user.id,
    deletedAt: null,
  };
  if (folderId) filter.folderId = folderId;
  if (favorite !== undefined) filter.isFavorite = favorite;
  if (archived !== undefined) filter.isArchived = archived;

  let query = Board.find(filter);
  if (search) {
    // Use regex on title for instant fuzzy match — text index is also defined
    // for heavier searches; regex feels snappier for short queries.
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query = query.where('title').regex(new RegExp(safe, 'i'));
  }

  const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };
  const total = await Board.countDocuments(query.getFilter());
  const boards = await query.sort(sort).skip((page - 1) * pageSize).limit(pageSize);
  res.json({
    items: boards.map((b) => b.toSummary()),
    total,
    page,
    pageSize,
  });
});

export const getBoard = asyncHandler(async (req, res) => {
  const board = await getOwnedBoard(req.params.id, req.user.id);
  const pages = await Page.find({ boardId: board._id })
    .select('-versions -scene')
    .sort({ index: 1 });
  board.lastOpenedAt = new Date();
  await board.save();
  res.json({
    board: board.toSummary(),
    pages: pages.map((p) => p.toSummary()),
  });
});

export const createBoard = asyncHandler(async (req, res) => {
  if (req.body.folderId) {
    const folder = await Folder.findOne({ _id: req.body.folderId, ownerId: req.user.id });
    if (!folder) throw HttpError.badRequest('Invalid folder');
  }
  const board = await Board.create({
    ownerId: req.user.id,
    title: req.body.title,
    description: req.body.description ?? null,
    mode: req.body.mode,
    folderId: req.body.folderId ?? null,
    tags: req.body.tags ?? [],
    pageCount: 1,
    lastOpenedAt: new Date(),
  });
  const page = await Page.create({
    boardId: board._id,
    ownerId: req.user.id,
    title: 'Page 1',
    index: 0,
  });
  await logActivity({
    actorId: req.user.id,
    kind: 'board.created',
    message: `Created board "${board.title}"`,
    targetKind: 'board',
    targetId: board._id,
  });
  res.status(201).json({
    board: board.toSummary(),
    pages: [page.toSummary()],
  });
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await getOwnedBoard(req.params.id, req.user.id);
  const fields = ['title', 'description', 'mode', 'tags', 'isFavorite', 'isArchived', 'thumbnailUrl', 'folderId'];
  for (const key of fields) {
    if (req.body[key] !== undefined) board[key] = req.body[key];
  }
  await board.save();
  await logActivity({
    actorId: req.user.id,
    kind: 'board.updated',
    message: `Updated board "${board.title}"`,
    targetKind: 'board',
    targetId: board._id,
  });
  res.json({ board: board.toSummary() });
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await getOwnedBoard(req.params.id, req.user.id);
  // Soft-delete first; a separate route can purge later.
  board.deletedAt = new Date();
  await board.save();
  await logActivity({
    actorId: req.user.id,
    kind: 'board.deleted',
    message: `Deleted board "${board.title}"`,
    targetKind: 'board',
    targetId: board._id,
  });
  res.status(204).end();
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const board = await getOwnedBoard(req.params.id, req.user.id);
  board.isFavorite = !board.isFavorite;
  await board.save();
  res.json({ board: board.toSummary() });
});

export const duplicateBoard = asyncHandler(async (req, res) => {
  const source = await getOwnedBoard(req.params.id, req.user.id);
  const copy = await Board.create({
    ownerId: req.user.id,
    title: `${source.title} (copy)`,
    description: source.description,
    mode: source.mode,
    folderId: source.folderId,
    tags: source.tags,
    thumbnailUrl: source.thumbnailUrl,
    pageCount: source.pageCount,
  });
  const sourcePages = await Page.find({ boardId: source._id }).sort({ index: 1 });
  const newPages = await Page.insertMany(
    sourcePages.map((p) => ({
      boardId: copy._id,
      ownerId: req.user.id,
      title: p.title,
      index: p.index,
      scene: p.scene,
      thumbnailUrl: p.thumbnailUrl,
      elementCount: p.elementCount,
    })),
  );
  res.status(201).json({
    board: copy.toSummary(),
    pages: newPages.map((p) => p.toSummary()),
  });
});

export const uploadBoardThumbnail = asyncHandler(async (req, res) => {
  const board = await getOwnedBoard(req.params.id, req.user.id);
  const result = await saveBoardThumbnail(board._id.toString(), req.body?.dataUrl);
  if (!result) throw HttpError.badRequest('Invalid data URL');
  board.thumbnailUrl = result.url;
  await board.save();
  res.json({ thumbnailUrl: result.url });
});
