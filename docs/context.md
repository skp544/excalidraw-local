---
name: session-context
description: Full state of what was built across all sessions — file map, architecture reminders, last known state
metadata:
  node_type: memory
  type: project
  originSessionId: bb872a18-3581-4f0a-998a-e5d1b27779ff
---

# Session Context (last updated 2026-06-18)

## Current state of the app

Fully functional. Three major feature sets implemented across three sessions.

---

## Feature 1: Command Snippet Panel (session 1)

- `Snippet` MongoDB model (`ownerId`, `command`, `description`, `tags`)
- Full CRUD API at `GET/POST/PATCH/DELETE /api/v1/snippets`
- `CommandPanel.jsx` — slides in from LEFT in `BoardEditorPage`
- Click a snippet → inserts dark terminal card + light description card onto Excalidraw canvas
- `use-snippets.js` — TanStack Query hooks
- `snippetCreateSchema` in shared schemas

**Key bug fixed:** `use-snippets.js` used default import for `api`; fixed to named import `{ api }`.

---

## Feature 2: Board page types + Note editor + Sidebar file tree (session 2)

### Backend
- `Board.pageType`: `'canvas' | 'note'` (default `'canvas'`)
- `Board.noteContent`: stores markdown for note boards
- `createBoard`: skips Page creation for notes
- `getBoard`: returns `noteContent`, skips Page query for notes
- `saveNoteContent`: `PATCH /boards/:id/note { content }` — validated by `noteUpdateSchema`
- `noteUpdateSchema` in shared schemas
- `boardListQuerySchema.pageSize` max bumped 100 → 500

### Frontend
- `NoteEditorPage.jsx` (`/note/:id`) — markdown editor (Write/Preview toggle), custom `mdToHtml`, debounced autosave 1.2s + `sendBeacon` on unload
- `App.jsx` — `/note/:id` route added
- `BoardCard.jsx` — routes note boards to `/note/:id`
- `CreateBoardModal.jsx` — Canvas/Note type toggle; hides mode selector for notes
- `use-boards.js` — added `useBoardsAll()` (pageSize 500) and `useUpdateNoteContent()`

---

## Feature 3: Sidebar drag-and-drop + Zustand refactor (session 3)

### New file: `apps/web/src/stores/sidebar-store.js`
Zustand store holding ALL sidebar UI state:
- `expandedIds` / `toggleExpand` / `expand`
- `editingId`, `editingName` / `startEdit`, `changeEditName`, `cancelEdit`
- `menuId` / `openMenu`, `closeMenu`
- `movePickerId` / `openMovePicker`, `closeMovePicker`
- `creatingIn`, `newFolderName` / `startNewFolder`, `changeNewFolderName`, `cancelNewFolder`
- `addingPageIn` / `setAddingPageIn`
- `draggingItem`, `dropTargetId` / `dndStart`, `dndEnd`, `dndEnter`, `dndLeave`, `dndClear`

**Why:** FolderRow previously had 24+ props passed recursively. User asked to use Zustand instead of prop-drilling.

### Sidebar.jsx (full rewrite)
- `FolderRow` now takes only `folder` + `depth` — reads everything else from `useSidebarStore()`
- `BoardItem` now takes only `board` + `depth`
- `TypePicker` takes `depth`, `folderId`, `onDone`, `showFolder` — calls mutations + store directly
- `NewFolderInput` reads/writes `newFolderName` from store; uses `autoFocus`
- `FolderSection` handles root drop target + delegates everything else to store

### Drag-and-drop (HTML5 native)
- Drag `FolderRow` or `BoardItem` → drop onto any folder row or "Workspace" header
- Drop onto folder → moves item into that folder (ring highlight + "drop" label)
- Drop onto "Workspace" header → moves to root (`folderId/parentId = null`)
- `makeDragGhost(label)` — custom dark pill ghost image
- Cycle prevention: `getDescendantIds(folderId, folders)` — can't drop folder into its own subtree
- Uses `useUpdateBoard({ folderId })` and `useUpdateFolder({ parentId })` mutations

---

## TanStack Query stale-cache fix (session 1)

`BoardEditorPage` uses `sceneLoadedRef` to prevent overwriting non-empty canvas with stale query cache. `activePage` is in the useEffect deps.

---

## Architecture reminders

- API: `apps/api` — Express + Mongoose + Socket.IO + Yjs + JWT
- Web: `apps/web` — Vite + React + Tailwind + Framer Motion + Zustand + TanStack Query + Excalidraw
- Shared: `packages/shared` — Zod schemas + constants + helpers
- Canvas locked to `theme:'light'`, `viewBackgroundColor:'#FFFFFF'`, `gridSize:null`, `currentItemStrokeColor:'#000000'`
- Boards are soft-deleted (`deletedAt: Date`) — every lookup must include `deletedAt: null`
- Auth: 15-min access tokens + 30-day refresh tokens with rotation + reuse detection
- `@excalidrow/shared` subpath imports need explicit Vite aliases in `vite.config.js`

---

## File map (changed files only)

```
apps/api/src/
  models/Board.js                   pageType + noteContent fields
  models/Snippet.js                 command snippet model
  controllers/board.controller.js   saveNoteContent added
  controllers/snippet.controller.js
  routes/board.routes.js            PATCH /:id/note added
  routes/snippet.routes.js

apps/web/src/
  stores/ui-store.js                sidebarWidth + sidebarCollapsed persisted
  stores/sidebar-store.js           NEW — all sidebar UI + drag state (Zustand)
  pages/BoardEditorPage.jsx         canvas editor + CommandPanel toggle + stale-cache fix
  pages/NoteEditorPage.jsx          NEW — markdown note editor
  pages/TemplatesPage.jsx           command-ref template
  components/dashboard/
    Sidebar.jsx                     Obsidian-style file tree; FolderRow/BoardItem use sidebar-store
    BoardCard.jsx                   routes notes to /note/:id
    CreateBoardModal.jsx            Canvas/Note type toggle
  hooks/use-boards.js               useBoardsAll + useUpdateNoteContent
  hooks/use-snippets.js
  components/editor/CommandPanel.jsx

packages/shared/src/schemas/index.js
  boardCreateSchema                 has pageType field
  noteUpdateSchema                  NEW — for PATCH /boards/:id/note
  snippetCreateSchema
  boardListQuerySchema              pageSize max = 500
```
