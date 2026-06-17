# Session Context (last updated 2026-06-18)

## Current state of the app

The app is fully functional and building clean. Two major feature sets were implemented across two sessions.

---

## Feature 1: Command Snippet Panel + Template (session 1)

**What was built:**
- `Snippet` MongoDB model (`ownerId`, `command`, `description`, `tags`)
- Full CRUD API at `GET/POST/PATCH/DELETE /api/v1/snippets`
- `CommandPanel.jsx` — slides in from LEFT in `BoardEditorPage`, lists personal command snippets
- Click a snippet → inserts a dark (terminal-style) + light (description) card pair onto the Excalidraw canvas
- `makeSnippetElements(command, description, x, y)` — creates the dark header (`#1e1e2e`, green text `#7ee787`, `fontFamily: 3` Cascadia) + light body rectangle
- `use-snippets.js` — TanStack Query hooks (`useSnippets`, `useCreateSnippet`, `useUpdateSnippet`, `useDeleteSnippet`)
- `snippetCreateSchema` in `packages/shared/src/schemas/index.js`
- "Command Reference" blank template added to `TemplatesPage`

**Key bug fixed:** `use-snippets.js` was using `import api from` (default) instead of `import { api } from` (named export).

---

## Feature 2: Board page types + Note editor + Sidebar file tree (session 2)

**What was built:**

### Backend
- `Board.pageType`: `'canvas' | 'note'` (default `'canvas'`)
- `Board.noteContent`: `String` (stores markdown content for note-type boards)
- `toSummary()` now includes `pageType`
- `createBoard`: skips Page creation for notes (`pageCount: 0`)
- `getBoard`: returns `noteContent`, skips Page query for notes
- `saveNoteContent`: `PATCH /boards/:id/note { content }` — validates with `noteUpdateSchema`
- `noteUpdateSchema` in shared schemas (`z.string().max(500000)`)
- `boardListQuerySchema.pageSize` max bumped from 100 → 500

### Frontend
- `NoteEditorPage.jsx` (`/note/:id`) — markdown editor (Write/Preview toggle), custom `mdToHtml` renderer, debounced autosave 1.2s + `sendBeacon` on unload
- `App.jsx` — `/note/:id` route added
- `Sidebar.jsx` — full rewrite; now shows boards inside folders as `BoardItem` rows (canvas=violetx, note=amber); folder hover shows "+" → inline `TypePicker` (Canvas | Note) → creates "Untitled" and navigates; "Root pages" section at bottom
- `BoardCard.jsx` — routes note boards to `/note/:id` instead of `/board/:id`
- `CreateBoardModal.jsx` — Canvas/Note type toggle at top; hides mode selector for notes
- `use-boards.js` — added `useBoardsAll()` (pageSize 500) and `useUpdateNoteContent()`

---

## Key bug fixed (session 1, still relevant)

**TanStack Query stale-cache race in `BoardEditorPage`:**
- `staleTime: 0` returns cached empty data first, then background refetches real data
- Original `useEffect([excalidrawApi, activePageId])` never re-fired when `activePage` updated
- Fix: added `activePage` to deps + `sceneLoadedRef` guard that prevents overwriting non-empty scenes

---

## Architecture reminders

- API: `apps/api` — Express + Mongoose + Socket.IO + Yjs + JWT
- Web: `apps/web` — Vite + React + Tailwind + Framer Motion + Zustand + TanStack Query + Excalidraw
- Shared: `packages/shared` — Zod schemas + constants + helpers
- Canvas is locked to `theme: 'light'`, `viewBackgroundColor: '#FFFFFF'`, `gridSize: null`, `currentItemStrokeColor: '#000000'` — these are forced after appState spread in `BoardEditorPage`
- Boards are soft-deleted (`deletedAt: Date`) — every lookup must include `deletedAt: null`
- Auth: 15-min access tokens + 30-day refresh tokens with rotation + reuse detection
- `@excalidrow/shared` subpath imports need explicit Vite aliases in `vite.config.js`

---

## File structure of interest

```
apps/api/src/
  models/Board.js          pageType + noteContent fields
  models/Snippet.js        command snippet model
  controllers/board.controller.js   saveNoteContent added
  controllers/snippet.controller.js
  routes/board.routes.js   PATCH /:id/note added
  routes/snippet.routes.js

apps/web/src/
  pages/BoardEditorPage.jsx   canvas editor + CommandPanel toggle
  pages/NoteEditorPage.jsx    NEW — markdown note editor
  pages/TemplatesPage.jsx     command-ref template
  components/dashboard/
    Sidebar.jsx            file tree with boards inside folders
    BoardCard.jsx          routes notes to /note/:id
    CreateBoardModal.jsx   Canvas/Note type toggle
  hooks/use-boards.js      useBoardsAll + useUpdateNoteContent
  hooks/use-snippets.js
  components/editor/CommandPanel.jsx

packages/shared/src/schemas/index.js
  boardCreateSchema        has pageType field
  noteUpdateSchema         NEW — for PATCH /boards/:id/note
  snippetCreateSchema
  boardListQuerySchema     pageSize max = 500
```
