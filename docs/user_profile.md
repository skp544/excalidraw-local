---
name: user-profile
description: "Who the user is, their preferences, and how to work with them"
metadata: 
  node_type: memory
  type: user
  originSessionId: bb872a18-3581-4f0a-998a-e5d1b27779ff
---

Building a personal note-taking and diagramming web app called **Excalidrow** — entirely for personal use, not multi-tenant SaaS.

- **Stack preference:** Pure JavaScript only (no TypeScript, no `.ts`/`.tsx`). ESM + JSX. Rejects TypeScript firmly.
- **Local-first:** MongoDB at `127.0.0.1:27017`, file uploads to disk. No Docker, no third-party cloud services.
- **Personal tool:** The only user is themselves. This means liberal limits (e.g., pageSize 500), no hardening for multi-user scenarios.
- **Inspired by Obsidian:** Wants folder/subfolder sidebar, page-level navigation, markdown notes alongside canvas drawings.
- **Communication style:** Terse messages, direct feedback. Will say "just go for it" when they agree. Doesn't want pre-populated template content.
- **Email:** shubhamkumarprajapati544@gmail.com
