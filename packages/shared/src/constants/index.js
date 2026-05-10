/**
 * Cross-cutting constants used by both api and web.
 * Keep this file dependency-free.
 */

export const BOARD_MODES = Object.freeze([
  'free',
  'kanban',
  'mindmap',
  'architecture',
  'notes',
]);

export const ACTIVITY_KINDS = Object.freeze([
  'board.created',
  'board.updated',
  'board.deleted',
  'board.opened',
  'board.exported',
  'board.imported',
  'page.created',
  'page.updated',
  'page.deleted',
  'asset.uploaded',
  'asset.deleted',
  'auth.login',
  'auth.register',
  'auth.logout',
]);

export const SOCKET_EVENTS = Object.freeze({
  // client → server
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  PRESENCE_CURSOR: 'presence:cursor',
  PRESENCE_SELECTION: 'presence:selection',
  YJS_UPDATE: 'yjs:update',
  YJS_AWARENESS: 'yjs:awareness',

  // server → client
  BOARD_JOINED: 'board:joined',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_LEAVE: 'presence:leave',
  YJS_REMOTE_UPDATE: 'yjs:remote-update',
  YJS_REMOTE_AWARENESS: 'yjs:remote-awareness',
  ERROR: 'app:error',
});

export const ASSET_KINDS = Object.freeze({
  IMAGE: 'image',
  EXPORT: 'export',
  THUMBNAIL: 'thumbnail',
  BOARD_BACKUP: 'board',
});

export const EXPORT_FORMATS = Object.freeze(['png', 'svg', 'pdf', 'json']);

export const MAX_PAGE_TITLE_LENGTH = 80;
export const MAX_BOARD_TITLE_LENGTH = 120;
export const MAX_TAGS_PER_BOARD = 16;
export const MAX_PAGES_PER_BOARD = 64;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB
export const ACCESS_TOKEN_TTL_SEC = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

/** Used by the AI placeholders so frontend can show a graceful "coming soon" state */
export const AI_FEATURES = Object.freeze([
  { id: 'prompt-to-diagram', label: 'Generate diagram from prompt' },
  { id: 'text-to-flowchart', label: 'Text → Flowchart' },
  { id: 'uml-generation', label: 'UML generation' },
  { id: 'mindmap-generation', label: 'Mindmap generation' },
]);
