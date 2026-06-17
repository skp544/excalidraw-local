---
name: project-features
description: "Excalidrow implemented features, page types, sidebar, drag-and-drop, and key model/route decisions"
metadata: 
  node_type: memory
  type: project
  originSessionId: bb872a18-3581-4f0a-998a-e5d1b27779ff
---

## Board page types (added 2026-06-18)

`Board.pageType` is now `'canvas' | 'note'` (default `'canvas'`).

- **Canvas** (`pageType: 'canvas'`): Excalidraw drawing, navigates to `/board/:id`, has child Page documents
- **Note** (`pageType: 'note'`): Markdown text editor, navigates to `/note/:id`, `noteContent` stored on Board itself (no child Page docs, `pageCount: 0`)

**Why:** User wanted Obsidian-style folder/page sidebar where each page can be either a canvas drawing or a markdown note.

**How to apply:** When creating boards, check `pageType`. Route note boards to `/note/:id`. Notes use `PATCH /boards/:id/note { content }` to autosave (debounced 1.2s + sendBeacon on unload).

## Sidebar file tree (added 2026-06-18)

Obsidian-style sidebar shows boards inside their folders. Hover a folder → "+" → TypePicker (Canvas | Note | Subfolder) → creates `Untitled` board and navigates. Root boards shown in "Pages" section below folder tree. Drag-to-resize handle on right edge (180–520px, persisted to localStorage via `useUIStore`).

`useBoardsAll()` fetches all boards with `pageSize: 500` (max bumped from 100 to 500 in `boardListQuerySchema`).

## Sidebar Zustand store (`sidebar-store.js`, added 2026-06-18)

All sidebar UI state lives in `apps/web/src/stores/sidebar-store.js` (Zustand). Replaces prop-drilling — FolderRow and BoardItem call `useSidebarStore()` directly.

State slices: `expandedIds`, `editingId/Name`, `menuId`, `movePickerId`, `creatingIn/newFolderName`, `addingPageIn`, `draggingItem`, `dropTargetId`.

**Why:** FolderRow previously had 24+ props passed down through recursive tree. User explicitly asked for Zustand over prop-drilling.

## Drag-and-drop in sidebar workspace (added 2026-06-18)

HTML5 drag-and-drop. Drag any `FolderRow` or `BoardItem` to:
- Drop onto a **folder row** → moves it into that folder (highlights with `ring-1 ring-violetx-400/40`)
- Drop onto **"Workspace" header** → moves to root (`folderId/parentId = null`)

Safety: can't drop a folder into its own subtree (`getDescendantIds` check). Board or folder already in target → no-op. Custom drag ghost (dark pill label) via `makeDragGhost()`. Uses `useUpdateBoard` (`folderId`) and `useUpdateFolder` (`parentId`) mutations.

## Command snippet panel

Slides in from LEFT in BoardEditorPage. Stores snippets in `Snippet` model. Click a snippet → inserts dark/light code card element onto canvas at position below existing elements.

## TanStack Query stale-cache fix

`BoardEditorPage` uses `sceneLoadedRef` to guard against overwriting canvas with stale cache data. Guard: if `sceneLoadedRef.current.pageId === activePageId && sceneLoadedRef.current.hasElements` → skip. `activePage` is in the useEffect deps.
