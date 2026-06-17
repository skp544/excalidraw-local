import { z } from 'zod';
import {
  BOARD_MODES,
  EXPORT_FORMATS,
  MAX_BOARD_TITLE_LENGTH,
  MAX_PAGE_TITLE_LENGTH,
  MAX_PAGES_PER_BOARD,
  MAX_TAGS_PER_BOARD,
} from '../constants/index.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'invalid id');

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    email: z.string().trim().toLowerCase().email().max(160),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(160),
    password: z.string().min(1).max(128),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(20).max(2048),
  })
  .strict();

export const userPreferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    defaultFont: z
      .enum(['Excalifont', 'Cascadia', 'Virgil', 'Helvetica', 'Inter'])
      .default('Excalifont'),
    snapToGrid: z.boolean().default(false),
    showGrid: z.boolean().default(true),
    reduceMotion: z.boolean().default(false),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    preferences: userPreferencesSchema.partial().optional(),
  })
  .strict();

export const boardCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_BOARD_TITLE_LENGTH),
    description: z.string().max(2000).optional().nullable(),
    mode: z.enum(BOARD_MODES).default('free'),
    pageType: z.enum(['canvas', 'note']).default('canvas').optional(),
    folderId: objectId.nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(MAX_TAGS_PER_BOARD).optional(),
    template: z.string().max(80).optional(),
  })
  .strict();

export const boardUpdateSchema = boardCreateSchema.partial().extend({
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  thumbnailUrl: z.string().nullable().optional(),
});

export const boardListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(24),
    search: z.string().trim().max(200).optional(),
    folderId: objectId.optional(),
    favorite: z.coerce.boolean().optional(),
    archived: z.coerce.boolean().optional(),
    sortBy: z.enum(['updatedAt', 'createdAt', 'title', 'lastOpenedAt']).default('updatedAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const pageCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_PAGE_TITLE_LENGTH).default('Untitled page'),
    index: z.number().int().min(0).max(MAX_PAGES_PER_BOARD).optional(),
  })
  .strict();

export const pageUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_PAGE_TITLE_LENGTH).optional(),
    index: z.number().int().min(0).max(MAX_PAGES_PER_BOARD).optional(),
    scene: z
      .object({
        elements: z.array(z.unknown()).max(20000),
        appState: z.record(z.unknown()).optional(),
        files: z.record(z.unknown()).optional(),
      })
      .optional(),
    thumbnailUrl: z.string().nullable().optional(),
  })
  .strict();

export const folderCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    color: z.string().max(20).nullable().optional(),
    parentId: objectId.nullable().optional(),
  })
  .strict();

export const folderUpdateSchema = folderCreateSchema.partial();

export const exportRequestSchema = z
  .object({
    boardId: objectId,
    pageId: objectId.optional(),
    format: z.enum(EXPORT_FORMATS),
    includeBackground: z.boolean().default(true),
    scale: z.coerce.number().min(0.5).max(4).default(2),
  })
  .strict();

export const aiGenerateSchema = z
  .object({
    feature: z.enum([
      'prompt-to-diagram',
      'text-to-flowchart',
      'uml-generation',
      'mindmap-generation',
    ]),
    prompt: z.string().trim().min(1).max(4000),
  })
  .strict();

export const noteUpdateSchema = z
  .object({
    content: z.string().max(500000).default(''),
  })
  .strict();

export const snippetCreateSchema = z.object({
  command: z.string().trim().min(1, 'Command is required').max(500),
  description: z.string().trim().max(1000).default(''),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
});

export { objectId };
