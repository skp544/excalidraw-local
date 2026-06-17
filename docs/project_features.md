---
name: project-features
description: "Excalidrow implemented features, page types, and key model/route decisions"
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

Sidebar shows boards inside their folders. Hover a folder → "+" button → TypePicker (Canvas | Note) → creates `Untitled` board in that folder and navigates. Root boards shown in "Root pages" section below folder tree.

`useBoardsAll()` fetches all boards with `pageSize: 500` (max bumped from 100 to 500 in `boardListQuerySchema`).

## Command snippet panel

Slides in from LEFT in BoardEditorPage. Stores snippets in `Snippet` model. Click a snippet → inserts dark/light code card element onto canvas at position below existing elements.

## TanStack Query stale-cache fix

`BoardEditorPage` uses `sceneLoadedRef` to guard against overwriting canvas with stale cache data. Guard: if `sceneLoadedRef.current.pageId === activePageId && sceneLoadedRef.current.hasElements` → skip. `activePage` is in the useEffect deps.
