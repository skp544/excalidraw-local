import { useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Sparkles } from 'lucide-react';

import { Topbar } from '@/components/dashboard/Topbar.jsx';
import { BoardCard } from '@/components/dashboard/BoardCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import {
  useBoardList,
  useDeleteBoard,
  useDuplicateBoard,
  useToggleFavorite,
} from '@/hooks/use-boards.js';
import { useUIStore } from '@/stores/ui-store.js';
import { apiError } from '@/lib/api.js';

export function DashboardPage() {
  const view = useUIStore((s) => s.view);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  const queryParams = useMemo(() => {
    const q = {
      pageSize: 48,
      sortBy: 'updatedAt',
      sortDir: 'desc',
    };
    if (params.get('favorite')) q.favorite = true;
    if (params.get('archived')) q.archived = true;
    if (params.get('folderId')) q.folderId = params.get('folderId');
    if (search) q.search = search;
    return q;
  }, [params, search]);

  const { data, isLoading, isFetching, isError, error } = useBoardList(queryParams);
  const toggleFav = useToggleFavorite();
  const dup = useDuplicateBoard();
  const del = useDeleteBoard();
  const ctx = useOutletContext();

  const items = data?.items ?? [];

  const subtitle = useMemo(() => {
    if (params.get('favorite')) return 'Your starred boards';
    if (params.get('archived')) return 'Boards you have moved aside';
    if (params.get('folderId')) return 'Folder contents';
    return `${data?.total ?? 0} board${(data?.total ?? 0) === 1 ? '' : 's'} on your machine`;
  }, [params, data?.total]);

  const title = params.get('favorite')
    ? 'Favorites'
    : params.get('archived')
    ? 'Archived'
    : 'All boards';

  const onDelete = async (b) => {
    if (!confirm(`Move "${b.title}" to trash?`)) return;
    try {
      await del.mutateAsync(b.id);
      toast.success('Moved to trash');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <>
      <Topbar
        title={title}
        subtitle={subtitle}
        search={search}
        onSearch={(q) => {
          setSearch(q);
          if (q) params.set('q', q);
          else params.delete('q');
          setParams(params, { replace: true });
        }}
      />

      <div className="relative flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {/* hero block when nothing is searched + small library */}
        {!search && items.length < 4 && !params.get('favorite') && !params.get('archived') && (
          <Hero onCreate={() => ctx?.onCreateBoard?.()} />
        )}

        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <EmptyState
            title="Couldn't load boards"
            description={apiError(error)}
            action={
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No boards yet"
            description="Create your first board and start sketching."
            action={
              <Button onClick={() => ctx?.onCreateBoard?.()}>
                <Plus className="h-4 w-4" />
                New board
              </Button>
            }
          />
        ) : view === 'grid' ? (
          <motion.ul
            layout
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            <AnimatePresence>
              {items.map((b) => (
                <BoardCard
                  key={b.id}
                  board={b}
                  onToggleFavorite={(brd) => toggleFav.mutate(brd.id)}
                  onDuplicate={(brd) => dup.mutate(brd.id)}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <ul className="space-y-2">
            {items.map((b) => (
              <BoardCard
                key={b.id}
                board={b}
                view="list"
                onToggleFavorite={(brd) => toggleFav.mutate(brd.id)}
                onDuplicate={(brd) => dup.mutate(brd.id)}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}

        {isFetching && !isLoading && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-ink-200/70 bg-white/85 px-3 py-1.5 text-xs text-ink-600 shadow-soft backdrop-blur-md dark:border-ink-700/70 dark:bg-ink-900/80 dark:text-ink-200">
            <span className="inline-flex items-center gap-2">
              <Spinner size={12} />
              Refreshing…
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function Hero({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 overflow-hidden rounded-3xl border border-ink-200/70 bg-gradient-to-br from-white via-violetx-50/60 to-indigo-50 px-6 py-8 shadow-soft dark:border-ink-700/60 dark:from-ink-900 dark:via-violetx-900/30 dark:to-indigo-900/30"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex-1">
          <span className="pill"><Sparkles className="h-3 w-3" />new</span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-balance">
            Think in pictures. Locally.
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500 dark:text-ink-300">
            Excalidrow gives you an infinite, premium canvas powered by Excalidraw — wired into a
            personal studio with folders, autosave, version history and exports. No cloud,
            no account sharing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New board
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white/70 dark:border-ink-700/60 dark:bg-ink-900/60">
          <div className="aspect-[16/10] skeleton rounded-none" />
          <div className="space-y-2 px-4 py-3">
            <div className="h-3 w-2/3 skeleton" />
            <div className="h-2.5 w-1/3 skeleton" />
          </div>
        </li>
      ))}
    </ul>
  );
}
