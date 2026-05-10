import { Topbar } from '@/components/dashboard/Topbar.jsx';
import { useActivity } from '@/hooks/use-boards.js';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { relativeTime } from '@excalidrow/shared/utils';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { Layers } from 'lucide-react';

export function ActivityPage() {
  const { data, isLoading } = useActivity();
  const items = data?.items ?? [];

  return (
    <>
      <Topbar title="Activity" subtitle="Everything that has happened in your studio" />
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Layers} title="Nothing yet" description="Activity from your work will appear here." />
        ) : (
          <ul className="mx-auto max-w-2xl space-y-1.5">
            {items.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-ink-200/70 bg-white/70 p-3.5 shadow-soft transition hover:border-violetx-300 dark:border-ink-700/60 dark:bg-ink-900/60 dark:hover:border-violetx-500/40"
              >
                <div className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-violetx-100 to-indigo-100 text-violetx-700 dark:from-violetx-500/30 dark:to-indigo-500/30 dark:text-violetx-200">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{entry.message}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">
                    {entry.kind} · {relativeTime(entry.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
