import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Star, Archive, Layers, Sparkles, Plus, Folder, Search, Settings,
  ChevronsLeft, ChevronsRight, BookTemplate,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useUIStore } from '@/stores/ui-store.js';
import { useFolders } from '@/hooks/use-boards.js';
import { cn } from '@/lib/cn.js';

const NAV = [
  { to: '/', icon: Home, label: 'All boards', match: /^\/$/ },
  { to: '/?favorite=1', icon: Star, label: 'Favorites', exact: true },
  { to: '/?archived=1', icon: Archive, label: 'Archived', exact: true },
  { to: '/templates', icon: BookTemplate, label: 'Templates' },
  { to: '/activity', icon: Layers, label: 'Activity' },
];

export function Sidebar({ onCreateBoard, onOpenCommandPalette }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { data: foldersData } = useFolders();
  const folders = foldersData?.items ?? [];
  const navigate = useNavigate();
  const [foldersOpen, setFoldersOpen] = useState(true);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 268 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-20 flex h-full flex-col border-r border-ink-200/70 bg-white/70 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60"
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <button
          onClick={() => navigate('/')}
          className={cn('focus-ring rounded-xl', collapsed && 'mx-auto')}
        >
          <Logo withWordmark={!collapsed} />
        </button>
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            title="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn('px-3', collapsed && 'px-2')}>
        <Button
          variant="primary"
          className={cn('w-full', collapsed && 'p-2')}
          onClick={onCreateBoard}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New board</span>}
        </Button>

        <button
          onClick={onOpenCommandPalette}
          className={cn(
            'mt-2 flex w-full items-center gap-2 rounded-xl border border-ink-200/70 bg-white/70 px-3 py-2 text-left text-sm text-ink-500 transition hover:bg-white focus-ring dark:border-ink-700/70 dark:bg-ink-900/70 dark:text-ink-400 dark:hover:bg-ink-800',
            collapsed && 'justify-center px-0',
          )}
          title="Search & commands (⌘K)"
        >
          <Search className="h-4 w-4" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">Search & commands</span>
              <kbd className="rounded-md border border-ink-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-2 scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-ring',
                    'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70',
                    isActive &&
                      'bg-violetx-50 text-violetx-700 hover:bg-violetx-50 dark:bg-violetx-500/10 dark:text-violetx-200',
                    collapsed && 'justify-center px-2',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {!collapsed && (
          <div className="mt-6">
            <button
              onClick={() => setFoldersOpen((v) => !v)}
              className="mb-1 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
            >
              <span>Folders</span>
              <span>{foldersOpen ? '−' : '+'}</span>
            </button>
            <AnimatePresence initial={false}>
              {foldersOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {folders.length === 0 && (
                    <li className="px-3 py-2 text-xs text-ink-400">No folders yet.</li>
                  )}
                  {folders.map((folder) => (
                    <li key={folder.id}>
                      <NavLink
                        to={`/?folderId=${folder.id}`}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70"
                      >
                        <Folder
                          className="h-4 w-4"
                          style={{ color: folder.color ?? undefined }}
                        />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <span className="text-xs text-ink-400">{folder.boardCount}</span>
                      </NavLink>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      <div className="border-t border-ink-200/70 p-3 dark:border-ink-800">
        {collapsed ? (
          <button
            onClick={toggleSidebar}
            className="grid h-9 w-full place-items-center rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            title="Expand"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        ) : (
          <NavLink
            to="/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto pill">
              <Sparkles className="h-3 w-3" />
              local
            </span>
          </NavLink>
        )}
      </div>
    </motion.aside>
  );
}
