import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn.js';

export function EmptyState({ icon: Icon = Sparkles, title, description, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200/80 bg-white/40 px-10 py-14 text-center dark:border-ink-700/60 dark:bg-ink-900/40',
        className,
      )}
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violetx-100 to-violetx-200 text-violetx-700 shadow-soft dark:from-violetx-900/40 dark:to-violetx-700/40 dark:text-violetx-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
