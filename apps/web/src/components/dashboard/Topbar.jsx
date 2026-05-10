import { LayoutGrid, List, Search, BellDot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';
import { useUIStore } from '@/stores/ui-store.js';
import { useAuthStore } from '@/stores/auth-store.js';
import { cn } from '@/lib/cn.js';
import { useDebouncedValue } from '@/hooks/use-debounce.js';

export function Topbar({ search, onSearch, title = 'All boards', subtitle }) {
  const [local, setLocal] = useState(search ?? '');
  const debounced = useDebouncedValue(local, 220);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    onSearch?.(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-ink-200/70 bg-canvas-light/80 px-6 py-3.5 backdrop-blur-xl dark:border-ink-800 dark:bg-canvas-dark/80">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-lg font-semibold tracking-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Search boards"
            className="w-64 rounded-xl border border-ink-200/70 bg-white/80 py-2 pl-9 pr-3 text-sm shadow-soft focus-ring placeholder:text-ink-400 dark:border-ink-700/70 dark:bg-ink-900/70"
          />
        </div>

        <div className="flex items-center rounded-xl border border-ink-200/70 bg-white/70 p-1 shadow-soft dark:border-ink-700/70 dark:bg-ink-900/60">
          {[
            { id: 'grid', icon: LayoutGrid },
            { id: 'list', icon: List },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setView(opt.id)}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-lg transition',
                view === opt.id
                  ? 'bg-violetx-100 text-violetx-700 dark:bg-violetx-500/20 dark:text-violetx-200'
                  : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100',
              )}
              title={opt.id === 'grid' ? 'Grid view' : 'List view'}
            >
              <opt.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <ThemeToggle />

        <button
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-ink-200/70 bg-white/70 text-ink-500 shadow-soft hover:text-ink-800 dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-300"
          title="Notifications"
        >
          <BellDot className="h-4 w-4" />
        </button>

        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-ink-200/70 bg-white/70 px-2.5 py-1.5 shadow-soft dark:border-ink-700/70 dark:bg-ink-900/60">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violetx-500 to-indigo-500 text-xs font-semibold text-white">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium leading-tight">{user.name}</div>
              <div className="text-[10px] leading-tight text-ink-500 dark:text-ink-400">
                {user.email}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
