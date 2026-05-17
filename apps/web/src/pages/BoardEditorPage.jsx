import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Image as ImageIcon, FileJson, FileType,
  Keyboard, Play, Sparkles, Star, Upload, Loader2,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';
import { PageTabs } from '@/components/editor/PageTabs.jsx';
import { AutosaveBadge } from '@/components/editor/AutosaveBadge.jsx';
import { ShortcutsPanel } from '@/components/editor/ShortcutsPanel.jsx';
import { AISidebar } from '@/components/editor/AISidebar.jsx';

import {
  useBoard,
  usePage,
  useCreatePage,
  useDeletePage,
  useToggleFavorite,
  useUpdateBoard,
  useUpdatePage,
} from '@/hooks/use-boards.js';
import { useHotkeys } from '@/hooks/use-hotkeys.js';
import { useAutosave } from '@/features/editor/useAutosave.js';
import { usePresence } from '@/features/editor/usePresence.js';
import { exportAndSave } from '@/features/editor/exporter.js';
import { api, apiError } from '@/lib/api.js';
import { cn } from '@/lib/cn.js';

export function BoardEditorPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: boardData, isLoading: boardLoading, error: boardError } = useBoard(boardId);
  const board = boardData?.board ?? null;
  const pages = useMemo(
    () => (boardData?.pages ?? []).slice().sort((a, b) => a.index - b.index),
    [boardData?.pages],
  );

  const [activePageId, setActivePageId] = useState(null);
  const requestedPageId = useRef(location.state?.pageId ?? null);
  useEffect(() => {
    if (!pages.length) return;
    const requested = requestedPageId.current;
    if (requested && pages.find((p) => p.id === requested)) {
      setActivePageId(requested);
      requestedPageId.current = null;
    } else if (!pages.find((p) => p.id === activePageId)) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  const { data: pageData } = usePage(boardId, activePageId);
  const activePage = pageData?.page ?? null;

  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const updatePage = useUpdatePage();
  const updateBoard = useUpdateBoard();
  const toggleFav = useToggleFavorite();

  const [excalidrawApi, setExcalidrawApi] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const { state: autosaveState, schedule: scheduleSave, flush: flushSave } = useAutosave({
    boardId,
    pageId: activePageId,
    excalidrawApi,
  });

  // Presence — wired but invisible until a second peer joins.
  usePresence({ boardId, pageId: activePageId });

  // Apply scene from server when the page changes.
  useEffect(() => {
    if (!excalidrawApi || !activePage) return;
    excalidrawApi.updateScene({
      elements: activePage.scene?.elements ?? [],
      appState: {
        ...(activePage.scene?.appState ?? {}),
        // The drawing canvas is always light + white so strokes stay
        // legible regardless of the surrounding app theme.
        theme: 'light',
        viewBackgroundColor: '#FFFFFF',
        gridSize: null,
        currentItemStrokeColor: '#000000',
        collaborators: new Map(),
      },
    });
    excalidrawApi.scrollToContent(undefined, { fitToContent: true, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excalidrawApi, activePageId]);

  const onDrawChange = useCallback(
    (elements, appState, files) => {
      if (!activePageId) return;
      // Strip the (huge) collaborators map before persisting.
      const { collaborators: _c, ...slim } = appState;
      scheduleSave({ elements, appState: slim, files });
    },
    [activePageId, scheduleSave],
  );

  const onAddPage = async () => {
    try {
      const data = await createPage.mutateAsync({ boardId, title: `Page ${pages.length + 1}` });
      setActivePageId(data.page.id);
      toast.success('Page added');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onDeletePage = async (pageId) => {
    if (pages.length <= 1) {
      toast.error('A board must have at least one page');
      return;
    }
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await deletePage.mutateAsync({ boardId, pageId });
      if (activePageId === pageId) {
        const next = pages.find((p) => p.id !== pageId);
        if (next) setActivePageId(next.id);
      }
      toast.success('Page deleted');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onRenamePage = async (pageId, title) => {
    try {
      await updatePage.mutateAsync({ boardId, pageId, title });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const renameBoard = async () => {
    const next = prompt('Rename board', board?.title ?? '');
    if (!next || next === board?.title) return;
    try {
      await updateBoard.mutateAsync({ id: boardId, title: next });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const doExport = async (format) => {
    if (!excalidrawApi || !board) return;
    setExportMenuOpen(false);
    try {
      await flushSave();
      await exportAndSave({ excalidrawApi, board, format });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onImportJson = async (file) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const { data } = await api.post('/export/import', payload);
      toast.success('Imported');
      navigate(`/board/${data.board.id}`);
    } catch (err) {
      toast.error('Could not import this file');
    }
  };

  // Hotkeys
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    flushSave();
    toast.success('Saved');
  }, [flushSave]);
  useHotkeys('mod+e', (e) => {
    e.preventDefault();
    doExport('png');
  }, [excalidrawApi, board]);
  useHotkeys('shift+/', () => setShortcutsOpen(true));
  useHotkeys('escape', () => setPresenting(false));

  if (boardError) {
    return (
      <div className="grid h-full place-items-center">
        <div className="text-center">
          <p className="font-display text-xl font-semibold">Board not found</p>
          <Button className="mt-4" onClick={() => navigate('/')}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-canvas-light dark:bg-canvas-dark">
      {/* Top bar */}
      <header className="z-10 flex items-center gap-3 border-b border-ink-200/70 bg-white/80 px-4 py-2 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/70">
        <button
          onClick={() => navigate('/')}
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <Logo withWordmark={false} />

        <div className="flex min-w-0 flex-col">
          <button
            onClick={renameBoard}
            className="flex items-center gap-1.5 truncate rounded-lg px-1.5 py-0.5 text-left font-display text-sm font-semibold tracking-tight transition hover:bg-ink-100 dark:hover:bg-ink-800"
            title="Click to rename"
          >
            {boardLoading ? 'Loading…' : board?.title ?? 'Untitled board'}
          </button>
          <div className="flex items-center gap-2 px-1.5 text-[11px] text-ink-500 dark:text-ink-400">
            <span className="uppercase tracking-wider">{board?.mode ?? '—'}</span>
            <span>·</span>
            <AutosaveBadge state={autosaveState} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => board && toggleFav.mutate(board.id)}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl border border-ink-200/70 bg-white/70 text-ink-500 shadow-soft transition hover:text-amber-500 dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-300',
              board?.isFavorite && 'text-amber-500',
            )}
            title={board?.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={cn('h-4 w-4', board?.isFavorite && 'fill-current')} />
          </button>

          <button
            onClick={() => setAiOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border border-ink-200/70 bg-white/70 px-2.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft transition hover:bg-white dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-200',
              aiOpen && 'border-violetx-300 bg-violetx-50 text-violetx-700 dark:border-violetx-500/60 dark:bg-violetx-500/10 dark:text-violetx-200',
            )}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>

          <button
            onClick={() => setShortcutsOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200/70 bg-white/70 text-ink-500 shadow-soft transition hover:bg-white dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-300"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200/70 bg-white/70 text-ink-500 shadow-soft transition hover:bg-white dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-300"
            title="Import JSON"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImportJson(e.target.files[0])}
          />

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="btn-outline"
              title="Export"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            {exportMenuOpen && (
              <ExportMenu onChoose={doExport} onClose={() => setExportMenuOpen(false)} />
            )}
          </div>

          <button
            onClick={() => setPresenting(true)}
            className="btn-primary"
            title="Presentation mode"
          >
            <Play className="h-4 w-4" />
            Present
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Page tabs */}
      <div className="z-10 flex items-center justify-between border-b border-ink-200/70 bg-white/70 px-3 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60">
        <PageTabs
          pages={pages}
          activePageId={activePageId}
          onSelect={setActivePageId}
          onAdd={onAddPage}
          onRename={onRenamePage}
        />
        <div className="flex items-center gap-2 pl-2">
          {createPage.isPending && (
            <span className="text-[11px] text-ink-500">
              <Loader2 className="inline h-3 w-3 animate-spin" /> adding…
            </span>
          )}
          <button
            onClick={() => navigate(`/board/${boardId}/pages`)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            title="Manage pages"
          >
            Manage pages
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        {boardLoading || !activePage ? (
          <div className="grid h-full place-items-center">
            <Spinner size={28} />
          </div>
        ) : (
          <Excalidraw
            key={activePageId}
            theme="light"
            initialData={{
              elements: activePage.scene?.elements ?? [],
              appState: {
                ...(activePage.scene?.appState ?? {}),
                // Forced — the drawing canvas is always a plain white page
                // with black strokes, regardless of saved state or app theme.
                viewBackgroundColor: '#FFFFFF',
                gridSize: null,
                theme: 'light',
                currentItemStrokeColor: '#000000',
              },
              files: activePage.scene?.files ?? {},
            }}
            onChange={onDrawChange}
            excalidrawAPI={(api) => setExcalidrawApi(api)}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: false,
                loadScene: false,
                saveAsImage: false,
                saveToActiveFile: false,
                toggleTheme: false,
              },
            }}
            renderTopRightUI={() => (
              <div className="hidden md:flex items-center gap-2 pr-2">
                <span className="pill"><Sparkles className="h-3 w-3" />local studio</span>
              </div>
            )}
            viewModeEnabled={presenting}
            zenModeEnabled={presenting}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
              <MainMenu.Separator />
              <MainMenu.Item icon={<ImageIcon className="h-4 w-4" />} onSelect={() => doExport('png')}>
                Download as PNG
              </MainMenu.Item>
              <MainMenu.Item icon={<FileType className="h-4 w-4" />} onSelect={() => doExport('svg')}>
                Download as SVG
              </MainMenu.Item>
              <MainMenu.Item icon={<FileJson className="h-4 w-4" />} onSelect={() => doExport('json')}>
                Download as JSON
              </MainMenu.Item>
            </MainMenu>
          </Excalidraw>
        )}

        <AISidebar open={aiOpen} onClose={() => setAiOpen(false)} excalidrawApi={excalidrawApi} />

        {/* Presentation overlay */}
        {presenting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/85 px-4 py-1.5 text-xs font-medium text-white shadow-ring backdrop-blur"
          >
            Presentation · press Esc to exit
          </motion.div>
        )}
      </div>

      <ShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

function ExportMenu({ onChoose, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-ring dark:border-ink-700/70 dark:bg-ink-900"
      onMouseLeave={onClose}
    >
      {[
        { id: 'png', label: 'PNG image', icon: ImageIcon },
        { id: 'svg', label: 'SVG vector', icon: FileType },
        { id: 'pdf', label: 'PDF document', icon: FileType },
        { id: 'json', label: 'Excalidrow JSON', icon: FileJson },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChoose(opt.id)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <opt.icon className="h-4 w-4" />
          {opt.label}
        </button>
      ))}
    </motion.div>
  );
}
