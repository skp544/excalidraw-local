import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Terminal, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/cn.js';
import { apiError } from '@/lib/api.js';
import {
  useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet,
} from '@/hooks/use-snippets.js';

/* ── element factory ──────────────────────────────────────────────────────── */

function uid() {
  return `sn_${Math.random().toString(36).slice(2, 9)}`;
}

function base(type, x, y, w, h, opts) {
  return {
    id: uid(), type, x, y, width: w, height: h,
    angle: 0, fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
    roughness: 0, opacity: 100, groupIds: [], isDeleted: false,
    boundElements: [], updated: 1, link: null, locked: false,
    version: 1, versionNonce: Math.floor(Math.random() * 1e9),
    backgroundColor: 'transparent', strokeColor: '#000000',
    ...opts,
  };
}

function makeSnippetElements(command, description, x, y) {
  const W = 440, HEADER_H = 52, BODY_H = 56;
  const els = [];

  // Dark command header
  els.push(base('rectangle', x, y, W, HEADER_H, {
    backgroundColor: '#1e1e2e', strokeColor: '#4a4a6a',
    roundness: { type: 3 },
  }));

  // $ command text (Cascadia = fontFamily 3)
  els.push({
    ...base('text', x + 14, y + 11, W - 28, 30, {
      strokeColor: '#7ee787', backgroundColor: 'transparent', roundness: null,
    }),
    text: `$ ${command}`, originalText: `$ ${command}`,
    fontSize: 16, fontFamily: 3,
    textAlign: 'left', verticalAlign: 'middle',
    containerId: null, lineHeight: 1.25,
  });

  if (description) {
    // Light description body
    els.push(base('rectangle', x, y + HEADER_H, W, BODY_H, {
      backgroundColor: '#f8fafc', strokeColor: '#e2e8f0', roundness: null,
    }));

    // Description text (Helvetica = fontFamily 2)
    els.push({
      ...base('text', x + 14, y + HEADER_H + 10, W - 28, 36, {
        strokeColor: '#475569', backgroundColor: 'transparent', roundness: null,
      }),
      text: description, originalText: description,
      fontSize: 14, fontFamily: 2,
      textAlign: 'left', verticalAlign: 'middle',
      containerId: null, lineHeight: 1.25,
    });
  }

  return els;
}

function getInsertPosition(excalidrawApi, hasDescription) {
  const existing = excalidrawApi.getSceneElements().filter((e) => !e.isDeleted);
  const W = 440, H = hasDescription ? 108 : 52;

  if (existing.length === 0) return { x: -W / 2, y: -H / 2 };

  // Stack below the lowest existing element with a gap
  const maxY = Math.max(...existing.map((e) => e.y + (e.height || 0)));
  const avgX = existing.reduce((s, e) => s + e.x, 0) / existing.length;
  return { x: avgX - W / 2, y: maxY + 24 };
}

/* ── panel ────────────────────────────────────────────────────────────────── */

export function CommandPanel({ open, onClose, excalidrawApi }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ command: '', description: '', tags: '' });

  const { data, isLoading } = useSnippets();
  const createSnippet = useCreateSnippet();
  const updateSnippet = useUpdateSnippet();
  const deleteSnippet = useDeleteSnippet();

  const snippets = data?.items ?? [];
  const filtered = search.trim()
    ? snippets.filter((s) =>
        s.command.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : snippets;

  const insertOnCanvas = (snippet) => {
    if (!excalidrawApi) { toast.error('Canvas not ready'); return; }
    const { x, y } = getInsertPosition(excalidrawApi, Boolean(snippet.description));
    const newEls = makeSnippetElements(snippet.command, snippet.description, x, y);
    const existing = excalidrawApi.getSceneElements().filter((e) => !e.isDeleted);
    excalidrawApi.updateScene({ elements: [...existing, ...newEls] });
    setTimeout(() => {
      try { excalidrawApi.scrollToContent(newEls, { animate: true }); } catch { /* noop */ }
    }, 60);
    toast.success('Inserted');
  };

  const openAddForm = () => {
    setAdding(true);
    setEditingId(null);
    setForm({ command: '', description: '', tags: '' });
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setAdding(false);
    setForm({ command: s.command, description: s.description, tags: s.tags.join(', ') });
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
    setForm({ command: '', description: '', tags: '' });
  };

  const parseTags = (str) => str.split(',').map((t) => t.trim()).filter(Boolean);

  const handleSave = async () => {
    const { command, description, tags } = form;
    if (!command.trim()) return;
    const payload = { command: command.trim(), description: description.trim(), tags: parseTags(tags) };
    try {
      if (editingId) {
        await updateSnippet.mutateAsync({ id: editingId, ...payload });
        toast.success('Updated');
      } else {
        await createSnippet.mutateAsync(payload);
        toast.success('Snippet saved');
      }
      cancelForm();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this snippet?')) return;
    try {
      await deleteSnippet.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const busy = createSnippet.isPending || updateSnippet.isPending;
  const formOpen = adding || editingId !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="cmd-panel"
          initial={{ x: -380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -380, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.21, 1.02, 0.73, 1] }}
          className="absolute left-3 top-3 z-30 flex h-[calc(100%-1.5rem)] w-[360px] flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white/90 shadow-ring backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-900/85"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white dark:from-slate-600 dark:to-slate-800">
                <Terminal className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-display text-sm font-semibold tracking-tight">Command Panel</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openAddForm}
                title="New snippet"
                className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Add / Edit form */}
          <AnimatePresence>
            {formOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden border-b border-ink-100 dark:border-ink-800"
              >
                <div className="flex flex-col gap-2.5 p-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      Command
                    </label>
                    <input
                      autoFocus
                      placeholder="ls -la"
                      value={form.command}
                      onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
                        if (e.key === 'Escape') cancelForm();
                      }}
                      className="field-input font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What does it do?"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="field-input resize-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      Tags{' '}
                      <span className="normal-case opacity-60">(comma-separated)</span>
                    </label>
                    <input
                      placeholder="git, filesystem, network"
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      className="field-input text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!form.command.trim() || busy}
                      className="btn-primary flex-1 py-1.5 text-xs disabled:opacity-50"
                    >
                      {editingId ? 'Save changes' : 'Save snippet'}
                    </button>
                    <button
                      onClick={cancelForm}
                      className="rounded-lg border border-ink-200/70 px-3 py-1.5 text-xs text-ink-500 transition hover:bg-ink-100 dark:border-ink-700/60 dark:hover:bg-ink-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="border-b border-ink-100 px-3 py-2 dark:border-ink-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                placeholder="Search commands…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-ink-100/80 py-1.5 pl-8 pr-3 text-xs text-ink-700 placeholder-ink-400 outline-none focus:ring-1 focus:ring-violetx-400 dark:bg-ink-800/80 dark:text-ink-200"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
            {isLoading ? (
              <p className="pt-8 text-center text-xs text-ink-400">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 pt-12 text-center">
                <Terminal className="h-8 w-8 text-ink-300 dark:text-ink-600" />
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
                  {search ? 'No matches' : 'No snippets yet'}
                </p>
                {!search && (
                  <p className="text-xs text-ink-400">
                    Click <strong>+</strong> to save your first command
                  </p>
                )}
              </div>
            ) : (
              filtered.map((s) =>
                editingId === s.id ? null : (
                  <SnippetCard
                    key={s.id}
                    snippet={s}
                    onInsert={() => insertOnCanvas(s)}
                    onEdit={() => startEdit(s)}
                    onDelete={() => handleDelete(s.id)}
                  />
                ),
              )
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-100 px-4 py-2.5 dark:border-ink-800">
            <p className="text-[10.5px] leading-relaxed text-ink-400">
              Click a snippet to insert it onto the canvas as a styled code card.
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ── snippet card ─────────────────────────────────────────────────────────── */

function SnippetCard({ snippet, onInsert, onEdit, onDelete }) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-ink-200/70 transition hover:border-violetx-300 hover:shadow-soft dark:border-ink-700/60 dark:hover:border-violetx-500/40"
      onClick={onInsert}
      title="Click to insert onto canvas"
    >
      {/* Dark command row */}
      <div className="flex items-center justify-between bg-[#1e1e2e] px-3 py-2.5">
        <span className="font-mono text-sm text-[#7ee787] truncate mr-2">
          $ {snippet.command}
        </span>
        <div
          className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            title="Edit"
            className="rounded p-1 text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="rounded p-1 text-ink-400 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Description + tags */}
      {(snippet.description || snippet.tags.length > 0) && (
        <div className="bg-white px-3 pb-2.5 pt-2 dark:bg-ink-900/80">
          {snippet.description && (
            <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              {snippet.description}
            </p>
          )}
          {snippet.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {snippet.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
