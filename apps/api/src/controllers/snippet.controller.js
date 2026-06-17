import { asyncHandler } from '../utils/async-handler.js';
import { Snippet } from '../models/index.js';
import { HttpError } from '../utils/errors.js';

export const listSnippets = asyncHandler(async (req, res) => {
  const snippets = await Snippet.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
  res.json({
    items: snippets.map((s) => ({
      id: s._id.toString(),
      command: s.command,
      description: s.description,
      tags: s.tags,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
});

export const createSnippet = asyncHandler(async (req, res) => {
  const snippet = await Snippet.create({
    ownerId: req.user.id,
    command: req.body.command,
    description: req.body.description ?? '',
    tags: req.body.tags ?? [],
  });
  res.status(201).json({
    snippet: {
      id: snippet._id.toString(),
      command: snippet.command,
      description: snippet.description,
      tags: snippet.tags,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
    },
  });
});

export const updateSnippet = asyncHandler(async (req, res) => {
  const snippet = await Snippet.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!snippet) throw HttpError.notFound('Snippet not found');
  if (req.body.command !== undefined) snippet.command = req.body.command;
  if (req.body.description !== undefined) snippet.description = req.body.description;
  if (req.body.tags !== undefined) snippet.tags = req.body.tags;
  await snippet.save();
  res.json({
    snippet: {
      id: snippet._id.toString(),
      command: snippet.command,
      description: snippet.description,
      tags: snippet.tags,
      updatedAt: snippet.updatedAt,
    },
  });
});

export const deleteSnippet = asyncHandler(async (req, res) => {
  const snippet = await Snippet.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  if (!snippet) throw HttpError.notFound('Snippet not found');
  res.status(204).end();
});
