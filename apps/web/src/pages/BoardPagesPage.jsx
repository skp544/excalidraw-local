import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, LayoutGrid, Plus, Trash2, Loader2, Pencil,
} from 'lucide-react';

import { Spinner } from '@/components/ui/Spinner.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useBoard, useCreatePage, useDeletePage, useUpdatePage } from '@/hooks/use-boards.js';
import { apiError } from '@/lib/api.js';
import { relativeTime } from '@excalidrow/shared/utils';
import { cn } from '@/lib/cn.js';

export function BoardPagesPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useBoard(boardId);

  const board = data?.board ?? null;
  const pages = (data?.pages ?? []).slice().sort((a, b) => a.index - b.index);

  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const updatePage = useUpdatePage();

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleOpen = (pageId) => {
    navigate(`/board/${boardId}`, { state: { pageId } });
  };

  const handleAdd = async () => {
    try {
      const res = await createPage.mutateAsync({
        boardId,
        title: `Page ${pages.length + 1}`,
      });
      toast.success('Page added');
      navigate(`/board/${boardId}`, { state: { pageId: res.page.id } });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handleDelete = async (page) => {
    if (pages.length <= 1) {
      toast.error('A board must have at least one page');
      return;
    }
    if (!confirm(`Delete "${page.title || 'Untitled'}"? This cannot be undone.`)) return;
    try {
      await deletePage.mutateAsync({ boardId, pageId: page.id });
      toast.success('Page deleted');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const startRename = (page) => {
    setRenamingId(page.id);
    setRenameValue(page.title || '');
  };

  const commitRename = async (page) => {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed || trimmed === page.title) return;
    try {
      await updatePage.mutateAsync({ boardId, pageId: page.id, title: trimmed });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="flex h-screen flex-col bg-surface dark:bg-ink-950">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-ink-200/70 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/80">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LayoutGrid className="h-4 w-4 flex-shrink-0 text-violetx-500" />
          <div className="min-w-0">
            <h1 className="truncate font-semibold leading-tight">
              {board?.title ?? 'Loading…'}
            </h1>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>

        <Button onClick={handleAdd} disabled={createPage.isPending} size="sm">
          {createPage.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Plus className="h-3.5 w-3.5" />}
          New page
        </Button>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-rose-500">{apiError(error)}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <motion.ul
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence>
              {pages.map((page, idx) => (
                <PageCard
                  key={page.id}
                  page={page}
                  index={idx}
                  isRenaming={renamingId === page.id}
                  renameValue={renameValue}
                  canDelete={pages.length > 1}
                  isDeleting={deletePage.isPending}
                  onOpen={() => handleOpen(page.id)}
                  onDelete={() => handleDelete(page)}
                  onRenameStart={() => startRename(page)}
                  onRenameChange={setRenameValue}
                  onRenameCommit={() => commitRename(page)}
                  onRenameCancel={() => setRenamingId(null)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </main>
    </div>
  );
}

function PageCard({
  page, index, isRenaming, renameValue, canDelete, isDeleting,
  onOpen, onDelete, onRenameStart, onRenameChange, onRenameCommit, onRenameCancel,
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft transition hover:border-violetx-200 hover:shadow-ring dark:border-ink-700/60 dark:bg-ink-900/70 dark:hover:border-violetx-500/40"
    >
      {/* Thumbnail / placeholder */}
      <button
        onClick={onOpen}
        className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden bg-ink-50 dark:bg-ink-800/60"
      >
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-300 dark:text-ink-700">
            <FileText className="h-8 w-8" />
            <span className="text-xs font-medium">Empty page</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-violetx-600/0 transition group-hover:bg-violetx-600/10">
          <span className="scale-90 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-violetx-700 opacity-0 shadow-ring transition group-hover:scale-100 group-hover:opacity-100 dark:bg-ink-900/90 dark:text-violetx-300">
            Open
          </span>
        </div>
      </button>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onRenameCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit();
                if (e.key === 'Escape') onRenameCancel();
              }}
              className="w-full rounded border border-violetx-300 bg-transparent px-1 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-violetx-400 dark:border-violetx-600"
            />
          ) : (
            <button
              onDoubleClick={onRenameStart}
              className="w-full truncate text-left text-sm font-medium"
              title="Double-click to rename"
            >
              {page.title || 'Untitled'}
            </button>
          )}
          <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
            {page.elementCount > 0
              ? `${page.elementCount} element${page.elementCount === 1 ? '' : 's'}`
              : 'Empty'}
            {' · '}{relativeTime(page.updatedAt)}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onRenameStart}
            title="Rename"
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete page"
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
