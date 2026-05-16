<!-- claude --resume "excalidraw-app" -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rules

- **Pure JavaScript, never TypeScript.** No `.ts`, `.tsx`, no `tsconfig.json`. The user explicitly rejected TypeScript. Use ESM (`"type": "module"`) and JSX. JSDoc is fine when it adds clarity.
- **Local-first, no third-party services.** No Docker, no Cloudinary/AWS/S3/external storage. Uploads land in `uploads/` on disk; MongoDB is a local server on `mongodb://127.0.0.1:27017`.
- **Single source of truth for validation/constants** is `packages/shared/`. Both api and web import zod schemas and constants from it.

## Common commands

```bash
# Install everything (npm workspaces — runs once at root)
npm install

# Dev (runs api + web in parallel via npm-run-all)
npm run dev                         # api → :7051, web → :7001

# Either side individually
npm --workspace @excalidrow/api run dev
npm --workspace @excalidrow/web run dev

# Build the web bundle (api needs no build step)
npm --workspace @excalidrow/web run build

# Seed a demo user (demo@excalidrow.local / demo1234)
npm --workspace @excalidrow/api run seed

# Health check
curl http://localhost:7051/healthz
curl http://localhost:7051/api/v1/health
```

There are no tests configured. Lint scripts (`npm run lint`) exist as placeholders but ESLint is not configured — they intentionally don't fail.

The web app proxies `/api`, `/uploads`, and `/socket.io` to `:7051` via `vite.config.js`, so during dev everything works on a single origin.

## Architecture in 60 seconds

```
apps/api    Express + Mongoose + Socket.IO + Yjs + Multer + Sharp + JWT (argon2 hashes, refresh-token rotation with reuse detection)
apps/web    Vite + React + Tailwind + Framer Motion + Zustand + TanStack Query + Excalidraw + Socket.IO client + Yjs
packages/shared    zod schemas (registerSchema, boardCreateSchema, etc.) + constants (SOCKET_EVENTS, BOARD_MODES, AI_FEATURES) + helpers (debounce, userColor, relativeTime)
uploads/    boards/ images/ exports/ thumbnails/   — Express serves these statically at /uploads/*
```

### Request flow on the API

`server.js` → `connectMongo` + `ensureStorageDirs` → `createApp` (Express factory in `app.js`) → `attachSockets` (HTTP server + Socket.IO).

Every API route lives under `/api/v1/*`, mounted in `routes/index.js`. The pattern is:

1. `routes/<resource>.routes.js` declares the surface and applies `requireAuth` + `validate({ body|query|params })` middleware.
2. `controllers/<resource>.controller.js` wraps each handler in `asyncHandler` and throws `HttpError.*` for failure cases.
3. `services/<thing>.service.js` holds anything reused across controllers (auth tokens, storage, activity logging).
4. Errors propagate to `middleware/error.js`, which knows how to format `HttpError`, `ZodError`, mongoose `CastError`/`ValidationError`, duplicate-key (11000), and Multer `LIMIT_FILE_SIZE` into JSON.

### Auth flow

- Access tokens: 15 min, signed with `JWT_ACCESS_SECRET`, audience `web`.
- Refresh tokens: 30 days, audience `refresh`, **stored server-side** in the `refreshtokens` collection with a TTL index. Each refresh rotates: the old jti is marked revoked + linked to the new jti via `replacedBy`. **Reusing a revoked refresh token revokes the entire user's session family** — see `auth.service.js:rotateRefreshToken`.
- The web app's axios client (`apps/web/src/lib/api.js`) holds a single in-flight `refreshPromise` so concurrent 401s don't trigger parallel refresh storms.

### Editor + autosave + Yjs

- The editor lives in `apps/web/src/pages/BoardEditorPage.jsx`. **The drawing canvas is locked to `theme="light"`, `viewBackgroundColor: '#FFFFFF'`, `gridSize: null`, and `currentItemStrokeColor: '#000000'`.** These are forced _after_ the saved appState spread — the user explicitly wants a plain white page with black strokes regardless of saved state or app theme. Don't reintroduce the dot grid or theme-coupled canvas colors.
- `useAutosave` in `apps/web/src/features/editor/useAutosave.js` debounces scene changes (1.2s), flushes on unmount, and uses `navigator.sendBeacon` on `beforeunload`. Every ~30s during edits it captures a webp thumbnail via Excalidraw's `exportToBlob` and uploads it to the board.
- Page version history is capped at 25 entries in `controllers/page.controller.js:updatePage`. A new version is only inserted if the element-payload size differs from the last by >4KB — most autosaves don't create a checkpoint.
- Realtime: `sockets/index.js` authenticates via the same access token and joins clients into `room:<boardId>:<pageId>`. `yjs-store.js` rehydrates a `Y.Doc` from `pages.yDoc` (base64) on first join, applies remote updates, and debounce-persists state back. **Today the app is single-user — collaboration is wired end-to-end and works the moment a second tab joins.**

### Exports

All rasterising/SVG/PDF generation happens in the browser via Excalidraw's `exportToBlob` / `exportToSvg` and `jspdf`. The server (`controllers/export.controller.js:saveExport`) is a dumb sink that persists the bytes to `uploads/exports/` and creates an `Asset` record. **Never add headless Chromium / canvas rendering on the server.**

## Quirks worth remembering

- **`@excalidrow/shared` subpath imports require explicit Vite aliases.** `vite.config.js` lists `@excalidrow/shared`, `@excalidrow/shared/schemas`, `@excalidrow/shared/constants`, `@excalidrow/shared/utils` separately. If you add a new shared subpath, add a matching alias.
- **Excalidraw 0.17.6 has no separate CSS file.** Don't write `import '@excalidraw/excalidraw/index.css'` — styles ship inside the main JS bundle. The build will fail otherwise.
- **`y-protocols` is intentionally not a dep.** It has no default `.` export and breaks the production build. The server's awareness forwarding is opaque (base64 strings), so `yjs` alone is enough on both sides.
- **Multer destination is computed via `diskPathFor('image', '')`** because Multer needs a directory string, not a function. Don't switch to memory storage — sharp reads from disk for thumbnail generation and we want the bytes persisted regardless.
- **Boards are soft-deleted** (`deletedAt: Date`). Every owned-board lookup must include `deletedAt: null`. There is no purge route yet.
- **`gridSize: null` (not `undefined`)** is what makes Excalidraw hide the dot grid. The forced overrides in `BoardEditorPage.jsx` use `null` deliberately.
- **Mongo `User.passwordHash`** has `select: false`. Use `.select('+passwordHash')` when verifying logins (see `auth.service.js`).

## AI integration is a stub

`controllers/ai.controller.js` returns `202 not-implemented`. The frontend in `components/editor/AISidebar.jsx` already plumbs the request and is ready to inject returned elements into the canvas if the response is `{ status: 'ok', elements: [...] }`. To enable AI: edit only `aiGenerate` in that controller — no other changes needed.

## When adding endpoints

1. Add the zod schema to `packages/shared/src/schemas/index.js` (so the front-end can reuse it for forms if needed).
2. Create the controller using `asyncHandler` and `HttpError.*`.
3. Mount the route under `/api/v1/<resource>`, applying `requireAuth` + `validate({ body|query|params })`.
4. Add a TanStack Query hook in `apps/web/src/hooks/use-boards.js` (or a new file under `hooks/`) — invalidate the right `boardKeys.*` on mutations.
5. Log meaningful state changes via `logActivity({ actorId, kind, message, ... })` — `kind` must be one of `ACTIVITY_KINDS` in shared constants.
