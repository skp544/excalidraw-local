import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store.js';
import { cn } from '@/lib/cn.js';

const ICONS = { light: Sun, dark: Moon, system: MonitorSmartphone };

export function ThemeToggle({ className }) {
  const { theme, cycleTheme } = useThemeStore();
  const Icon = ICONS[theme];
  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'group relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-ink-200/70 bg-white/70 text-ink-600 shadow-soft transition hover:bg-white focus-ring dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-800',
        className,
      )}
      aria-label={`Theme: ${theme}`}
      title={`Theme: ${theme} (click to cycle)`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -16, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2, ease: [0.21, 1.02, 0.73, 1] }}
        >
          <Icon className="h-4 w-4" />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
