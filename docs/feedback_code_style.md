---
name: feedback-code-style
description: Code style rules and approach preferences confirmed by the user
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb872a18-3581-4f0a-998a-e5d1b27779ff
---

## No TypeScript
Never use `.ts`, `.tsx`, or `tsconfig.json`. Pure JavaScript only (ESM + JSX).

**Why:** User explicitly rejected TypeScript at project start and will reject any TS suggestion.

**How to apply:** Write all new files as `.js` or `.jsx`. Use JSDoc only when it genuinely adds clarity.

## No pre-populated template content
When the user asks for a new template, create it blank (just a title bar + hint text at most) — do not fill it with sample data.

**Why:** This is a personal notes app; the user wants to write their own content, not clear out boilerplate.

**How to apply:** Templates start minimal. Only structural scaffold elements, no sample text beyond a short usage hint.

## No Docker, no external services
All storage is local disk. MongoDB is always `mongodb://127.0.0.1:27017`. Uploads go to `uploads/` on disk.

**Why:** Local-first is a hard requirement, not a preference.

**How to apply:** Never suggest Cloudinary, AWS S3, Docker Compose, or any cloud dependency.

## Quick create UX > modal-heavy UX
When adding inline creation (e.g., "+" in sidebar), prefer immediate creation with title "Untitled" and immediate navigation over opening a modal.

**Why:** User confirmed "just go for A + C" style choices — they prefer fast action over configuration.

**How to apply:** Sidebar "+" creates immediately. Full modal exists for when user wants title/description/mode.
