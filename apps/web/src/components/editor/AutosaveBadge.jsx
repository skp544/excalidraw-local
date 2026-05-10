import { Check, CloudOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn.js';

const STATES = {
  idle: { label: 'All changes saved', icon: Check, tone: 'text-emerald-500' },
  saving: { label: 'Saving…', icon: Loader2, tone: 'text-violetx-500 animate-spin' },
  saved: { label: 'Saved', icon: Check, tone: 'text-emerald-500' },
  offline: { label: 'Offline (local cache)', icon: CloudOff, tone: 'text-amber-500' },
  error: { label: 'Save failed — retrying', icon: CloudOff, tone: 'text-rose-500' },
};

export function AutosaveBadge({ state = 'idle' }) {
  const meta = STATES[state] ?? STATES.idle;
  const Icon = meta.icon;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200/70 bg-white/85 px-2 py-1 text-[11px] font-medium text-ink-600 shadow-soft dark:border-ink-700/70 dark:bg-ink-900/70 dark:text-ink-200"
      >
        <Icon className={cn('h-3.5 w-3.5', meta.tone)} />
        <span>{meta.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
