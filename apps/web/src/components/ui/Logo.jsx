import { cn } from '@/lib/cn.js';

export function Logo({ className, withWordmark = true }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violetx-500 via-violetx-600 to-indigo-700 shadow-glow">
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="none">
          <path
            d="M5 24 L11 9 L17 19 L22 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="24" r="2.4" fill="currentColor" />
        </svg>
      </div>
      {withWordmark && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white">
            Excalidrow
          </div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
            local studio
          </div>
        </div>
      )}
    </div>
  );
}
