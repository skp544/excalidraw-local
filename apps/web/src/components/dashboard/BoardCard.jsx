import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Star, Copy, Trash2, FolderInput, FolderX, ChevronRight, Folder,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { cn } from '@/lib/cn.js';
import { relativeTime } from '@excalidrow/shared/utils';
import { useFolders, useUpdateBoard } from '@/hooks/use-boards.js';
import { apiError } from '@/lib/api.js';

export function BoardCard({ board, onToggleFavorite, onDuplicate, onDelete, view = 'grid' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const { data: foldersData } = useFolders();
  const folders = foldersData?.items ?? [];
  const updateBoard = useUpdateBoard();

  const to = board.pageType === 'note'
    ? `/note/${board.id}`
    : (board.pageCount ?? 1) > 1
      ? `/board/${board.id}/pages`
      : `/board/${board.id}`;

  const closeMenu = () => { setMenuOpen(false); setFolderPickerOpen(false); };

  const handleMoveToFolder = async (folderId) => {
    closeMenu();
    try {
      await updateBoard.mutateAsync({ id: board.id, folderId });
      const folder = folders.find((f) => f.id === folderId);
      toast.success(folderId ? `Moved to "${folder?.name}"` : 'Removed from folder');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (view === 'list') {
    return (
      <li className="group relative flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white/80 px-3 py-2.5 shadow-soft transition hover:border-violetx-200 hover:bg-white dark:border-ink-700/60 dark:bg-ink-900/60 dark:hover:border-violetx-500/40">
        <Link to={to} className="flex flex-1 items-center gap-3 truncate">
          <ThumbPreview board={board} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{board.title || 'Untitled'}</div>
            <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              {board.pageCount} {board.pageCount === 1 ? 'page' : 'pages'}
              {board.folderId && (() => {
                const f = folders.find((x) => x.id === board.folderId);
                return f ? (
                  <>
                    <span>·</span>
                    <Folder className="h-3 w-3" style={{ color: f.color ?? undefined }} />
                    <span className="truncate">{f.name}</span>
                  </>
                ) : null;
              })()}
              <span>·</span>
              {relativeTime(board.updatedAt)}
            </div>
          </div>
        </Link>

        <button
          onClick={() => onToggleFavorite?.(board)}
          className={cn(
            'rounded-lg p-1.5 text-ink-400 transition hover:text-amber-500',
            board.isFavorite && 'text-amber-500',
          )}
        >
          <Star className={cn('h-4 w-4', board.isFavorite && 'fill-current')} />
        </button>

        {/* List view ··· menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); setFolderPickerOpen(false); }}
            className="rounded-lg p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:text-ink-700 dark:hover:text-ink-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <ContextMenu
                board={board}
                folders={folders}
                folderPickerOpen={folderPickerOpen}
                onFolderPickerOpen={() => setFolderPickerOpen(true)}
                onMoveToFolder={handleMoveToFolder}
                onDuplicate={() => { closeMenu(); onDuplicate?.(board); }}
                onDelete={() => { closeMenu(); onDelete?.(board); }}
                onClose={closeMenu}
                align="right"
              />
            )}
          </AnimatePresence>
        </div>
      </li>
    );
  }

  /* ── Grid view ── */
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.21, 1.02, 0.73, 1] }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      <Link
        to={to}
        className="block overflow-hidden rounded-2xl border border-ink-200/70 bg-white/85 shadow-soft transition focus-ring dark:border-ink-700/60 dark:bg-ink-900/60"
      >
        <ThumbPreview board={board} />
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{board.title || 'Untitled'}</div>
            <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              {board.pageCount} {board.pageCount === 1 ? 'page' : 'pages'}
              {board.folderId && (() => {
                const f = folders.find((x) => x.id === board.folderId);
                return f ? (
                  <>
                    <span>·</span>
                    <Folder className="h-3 w-3 flex-shrink-0" style={{ color: f.color ?? undefined }} />
                    <span className="truncate">{f.name}</span>
                  </>
                ) : null;
              })()}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(board);
            }}
            className={cn(
              'rounded-lg p-1.5 text-ink-400 transition hover:text-amber-500',
              board.isFavorite && 'text-amber-500',
            )}
            title={board.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={cn('h-4 w-4', board.isFavorite && 'fill-current')} />
          </button>
        </div>
      </Link>

      {/* ··· button */}
      <div className="absolute right-3 top-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
            setFolderPickerOpen(false);
          }}
          className="rounded-lg bg-white/80 p-1.5 text-ink-500 opacity-0 shadow-soft transition group-hover:opacity-100 dark:bg-ink-900/80 dark:text-ink-300"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <ContextMenu
              board={board}
              folders={folders}
              folderPickerOpen={folderPickerOpen}
              onFolderPickerOpen={() => setFolderPickerOpen(true)}
              onMoveToFolder={handleMoveToFolder}
              onDuplicate={() => { closeMenu(); onDuplicate?.(board); }}
              onDelete={() => { closeMenu(); onDelete?.(board); }}
              onClose={closeMenu}
              align="right"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Context menu ─────────────────────────────────────────────────────────── */

function ContextMenu({
  board, folders, folderPickerOpen, onFolderPickerOpen,
  onMoveToFolder, onDuplicate, onDelete, onClose,
}) {
  const currentFolder = folders.find((f) => f.id === board.folderId);

  return (
    <motion.div
      key="ctx-menu"
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-ring dark:border-ink-700/70 dark:bg-ink-900"
      onMouseLeave={onClose}
    >
      {folderPickerOpen ? (
        /* ── Folder picker panel ── */
        <>
          <div className="border-b border-ink-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800">
            Move to folder
          </div>
          <div className="max-h-52 overflow-y-auto scrollbar-thin py-1">
            {folders.length === 0 ? (
              <p className="px-3 py-2 text-xs text-ink-400">No folders yet. Create one in the sidebar.</p>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onMoveToFolder(f.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-ink-100 dark:hover:bg-ink-800',
                    board.folderId === f.id && 'bg-violetx-50 text-violetx-700 dark:bg-violetx-500/10 dark:text-violetx-200',
                  )}
                >
                  <Folder className="h-3.5 w-3.5 flex-shrink-0" style={{ color: f.color ?? undefined }} />
                  <span className="flex-1 truncate">{f.name}</span>
                  {board.folderId === f.id && (
                    <span className="text-[10px] font-medium text-violetx-500">current</span>
                  )}
                </button>
              ))
            )}
          </div>
          {board.folderId && (
            <>
              <div className="border-t border-ink-100 dark:border-ink-800" />
              <button
                onClick={() => onMoveToFolder(null)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <FolderX className="h-3.5 w-3.5" />
                Remove from folder
              </button>
            </>
          )}
        </>
      ) : (
        /* ── Default menu ── */
        <>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={(e) => { e.preventDefault(); onDuplicate(); }}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={(e) => { e.preventDefault(); onFolderPickerOpen(); }}
          >
            <span className="flex items-center gap-2">
              <FolderInput className="h-3.5 w-3.5" />
              {currentFolder ? (
                <span>
                  Move folder
                  <span className="ml-1 text-ink-400">({currentFolder.name})</span>
                </span>
              ) : 'Add to folder'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
          </button>
          <div className="my-1 border-t border-ink-100 dark:border-ink-800" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            onClick={(e) => { e.preventDefault(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Move to trash
          </button>
        </>
      )}
    </motion.div>
  );
}

/* ── Thumbnail preview ────────────────────────────────────────────────────── */

function ThumbPreview({ board, size = 'md' }) {
  if (board.thumbnailUrl) {
    return (
      <div
        className={cn(
          'overflow-hidden bg-ink-100 dark:bg-ink-800',
          size === 'sm' ? 'h-12 w-16 rounded-lg' : 'aspect-[16/10] rounded-t-2xl',
        )}
      >
        <img
          src={board.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  const palette = [
    'from-violetx-200 to-indigo-200',
    'from-rose-200 to-amber-200',
    'from-emerald-200 to-cyan-200',
    'from-sky-200 to-violetx-200',
  ];
  const grad = palette[(board.title || '').length % palette.length];
  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden bg-gradient-to-br text-white',
        grad,
        size === 'sm' ? 'h-12 w-16 rounded-lg' : 'aspect-[16/10] rounded-t-2xl',
      )}
    >
      <div className="absolute inset-0 grid-bg-light opacity-40" />
      <div className="font-display text-2xl font-semibold tracking-tight text-ink-700 mix-blend-multiply">
        {(board.title || 'Untitled').slice(0, 2).toUpperCase()}
      </div>
    </div>
  );
}
