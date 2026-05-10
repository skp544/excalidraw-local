import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FilePlus2, Star, Archive, Settings, Layers, Moon, Sun } from 'lucide-react';

import { useUIStore } from '@/stores/ui-store.js';
import { useBoardList } from '@/hooks/use-boards.js';
import { useThemeStore } from '@/stores/theme-store.js';
import { cn } from '@/lib/cn.js';

export function CommandPalette({ onCreateBoard }) {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const setTheme = useThemeStore((s) => s.setTheme);

  const { data } = useBoardList({ pageSize: 6, search: query || undefined });
  const boards = data?.items ?? [];

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setQuery('');
    }
  }, [open]);

  const actions = useMemo(
    () => [
      { id: 'new-board', label: 'Create new board', icon: FilePlus2, run: () => onCreateBoard?.() },
      { id: 'favorites', label: 'Open favorites', icon: Star, run: () => navigate('/?favorite=1') },
      { id: 'archived', label: 'Open archived', icon: Archive, run: () => navigate('/?archived=1') },
      { id: 'activity', label: 'View activity log', icon: Layers, run: () => navigate('/activity') },
      { id: 'settings', label: 'Open settings', icon: Settings, run: () => navigate('/settings') },
      { id: 'theme-light', label: 'Switch to light theme', icon: Sun, run: () => setTheme('light') },
      { id: 'theme-dark', label: 'Switch to dark theme', icon: Moon, run: () => setTheme('dark') },
    ],
    [navigate, onCreateBoard, setTheme],
  );

  const filteredActions = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  const items = useMemo(
    () => [
      ...filteredActions.map((a) => ({ kind: 'action', a })),
      ...boards.map((b) => ({ kind: 'board', b })),
    ],
    [filteredActions, boards],
  );

  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [query, items.length]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[active];
      if (!item) return;
      if (item.kind === 'action') item.a.run();
      else navigate(`/board/${item.b.id}`);
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Dismiss"
            onClick={close}
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-md dark:bg-black/55"
          />
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.21, 1.02, 0.73, 1] }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-ring dark:border-ink-700/60 dark:bg-ink-900"
          >
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search boards…"
                className="w-full bg-transparent text-sm placeholder:text-ink-400 focus:outline-none"
              />
              <kbd className="rounded-md border border-ink-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400">
                Esc
              </kbd>
            </div>

            <ul className="max-h-[60vh] overflow-y-auto py-2 scrollbar-thin">
              {filteredActions.length > 0 && (
                <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Actions
                </li>
              )}
              {filteredActions.map((a, i) => (
                <li key={a.id}>
                  <button
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                      active === i
                        ? 'bg-violetx-50 text-violetx-700 dark:bg-violetx-500/15 dark:text-violetx-200'
                        : 'hover:bg-ink-100 dark:hover:bg-ink-800',
                    )}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      a.run();
                      close();
                    }}
                  >
                    <a.icon className="h-4 w-4" />
                    <span>{a.label}</span>
                  </button>
                </li>
              ))}

              {boards.length > 0 && (
                <li className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Boards
                </li>
              )}
              {boards.map((b, i) => {
                const idx = filteredActions.length + i;
                return (
                  <li key={b.id}>
                    <button
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                        active === idx
                          ? 'bg-violetx-50 text-violetx-700 dark:bg-violetx-500/15 dark:text-violetx-200'
                          : 'hover:bg-ink-100 dark:hover:bg-ink-800',
                      )}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => {
                        navigate(`/board/${b.id}`);
                        close();
                      }}
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-violetx-400 to-indigo-500 text-[10px] font-semibold text-white">
                        {(b.title || 'U').slice(0, 1).toUpperCase()}
                      </span>
                      <span className="flex-1 truncate">{b.title}</span>
                      <span className="text-[10px] uppercase tracking-wider text-ink-400">
                        {b.mode}
                      </span>
                    </button>
                  </li>
                );
              })}

              {items.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
                  No matches.
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
