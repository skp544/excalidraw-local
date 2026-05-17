import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, Star, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn.js';
import { relativeTime } from '@excalidrow/shared/utils';

export function BoardCard({ board, onToggleFavorite, onDuplicate, onDelete, view = 'grid' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const to = (board.pageCount ?? 1) > 1
    ? `/board/${board.id}/pages`
    : `/board/${board.id}`;

  if (view === 'list') {
    return (
      <li className="group flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white/80 px-3 py-2.5 shadow-soft transition hover:border-violetx-200 hover:bg-white dark:border-ink-700/60 dark:bg-ink-900/60 dark:hover:border-violetx-500/40">
        <Link to={to} className="flex flex-1 items-center gap-3 truncate">
          <ThumbPreview board={board} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{board.title || 'Untitled'}</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">
              {board.pageCount} {board.pageCount === 1 ? 'page' : 'pages'} · {relativeTime(board.updatedAt)}
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
      </li>
    );
  }

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
            <div className="text-xs text-ink-500 dark:text-ink-400">
              {board.pageCount} {board.pageCount === 1 ? 'page' : 'pages'} · {relativeTime(board.updatedAt)}
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

      <button
        onClick={(e) => {
          e.preventDefault();
          setMenuOpen((v) => !v);
        }}
        className="absolute right-3 top-3 rounded-lg bg-white/80 p-1.5 text-ink-500 opacity-0 shadow-soft transition group-hover:opacity-100 dark:bg-ink-900/80 dark:text-ink-300"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div
          className="absolute right-2 top-12 z-10 w-40 overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-ring dark:border-ink-700/70 dark:bg-ink-900"
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              onDuplicate?.(board);
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              onDelete?.(board);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Move to trash
          </button>
        </div>
      )}
    </motion.div>
  );
}

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
