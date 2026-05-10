import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn.js';

export function PageTabs({ pages = [], activePageId, onSelect, onAdd, onDelete }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-1.5 py-1 scrollbar-thin">
      {pages.map((p) => {
        const active = p.id === activePageId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect?.(p.id)}
            className={cn(
              'group relative flex max-w-[200px] flex-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
              active
                ? 'bg-violetx-100 text-violetx-700 dark:bg-violetx-500/20 dark:text-violetx-100'
                : 'text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/60',
            )}
          >
            <span className="truncate">{p.title || 'Untitled'}</span>
            {pages.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(p.id);
                }}
                className="rounded p-0.5 opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            {active && (
              <motion.span
                layoutId="page-tab-indicator"
                className="absolute inset-x-1 -bottom-[2px] h-[2px] rounded-full bg-violetx-500"
              />
            )}
          </button>
        );
      })}
      <button
        onClick={onAdd}
        className="flex flex-none items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/60"
        title="Add page"
      >
        <Plus className="h-3.5 w-3.5" />
        Page
      </button>
    </div>
  );
}
