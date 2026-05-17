import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn.js';

export function PageTabs({ pages = [], activePageId, onSelect, onAdd, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  function startEdit(p, e) {
    e.stopPropagation();
    setEditingId(p.id);
    setEditingValue(p.title || 'Untitled');
  }

  function commitEdit(p) {
    const trimmed = editingValue.trim();
    if (trimmed && trimmed !== p.title) {
      onRename?.(p.id, trimmed);
    }
    setEditingId(null);
  }

  function handleKeyDown(e, p) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(p); }
    if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-1.5 py-1 scrollbar-thin">
      {pages.map((p) => {
        const active = p.id === activePageId;
        const editing = p.id === editingId;

        return (
          <div
            key={p.id}
            onClick={() => !editing && onSelect?.(p.id)}
            className={cn(
              'group relative flex max-w-[200px] flex-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer',
              active
                ? 'bg-violetx-100 text-violetx-700 dark:bg-violetx-500/20 dark:text-violetx-100'
                : 'text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/60',
            )}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => commitEdit(p)}
                onKeyDown={(e) => handleKeyDown(e, p)}
                onClick={(e) => e.stopPropagation()}
                className="w-24 min-w-0 bg-transparent outline-none ring-0 text-xs font-medium"
              />
            ) : (
              <span
                className="truncate"
                onDoubleClick={(e) => startEdit(p, e)}
                title="Double-click to rename"
              >
                {p.title || 'Untitled'}
              </span>
            )}

            {active && (
              <motion.span
                layoutId="page-tab-indicator"
                className="absolute inset-x-1 -bottom-[2px] h-[2px] rounded-full bg-violetx-500"
              />
            )}
          </div>
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
