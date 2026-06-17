import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutTemplate, GitBranch, KanbanSquare, BrainCircuit, StickyNote,
  Layout, FileText,
} from 'lucide-react';

import { Modal } from '@/components/ui/Modal.jsx';
import { Input, Textarea } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useCreateBoard } from '@/hooks/use-boards.js';
import { apiError } from '@/lib/api.js';
import { cn } from '@/lib/cn.js';

const CANVAS_MODES = [
  { id: 'free', label: 'Freeform', icon: LayoutTemplate, hint: 'A blank infinite canvas.' },
  { id: 'architecture', label: 'Architecture', icon: GitBranch, hint: 'Diagrams and system design.' },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare, hint: 'Cards and lanes for planning.' },
  { id: 'mindmap', label: 'Mindmap', icon: BrainCircuit, hint: 'Branching ideas from a core.' },
  { id: 'notes', label: 'Sticky notes', icon: StickyNote, hint: 'Sticky-note brainstorm canvas.' },
];

export function CreateBoardModal({ open, onClose }) {
  const [pageType, setPageType] = useState('canvas');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('free');
  const create = useCreateBoard();
  const navigate = useNavigate();

  const reset = () => {
    setPageType('canvas');
    setTitle('');
    setDescription('');
    setMode('free');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const data = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        mode: pageType === 'note' ? 'free' : mode,
        pageType,
      });
      toast.success(pageType === 'note' ? 'Note created' : 'Board created');
      onClose?.();
      reset();
      navigate(pageType === 'note' ? `/note/${data.board.id}` : `/board/${data.board.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose?.(); reset(); }}
      title="Create new page"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose?.(); reset(); }}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={create.isPending || !title.trim()}>
            {create.isPending ? 'Creating…' : pageType === 'note' ? 'Create note' : 'Create board'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Page type toggle */}
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Type
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPageType('canvas')}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white/80 p-3 text-left text-sm transition hover:border-violetx-300 hover:bg-white focus-ring dark:border-ink-700 dark:bg-ink-900/70 dark:hover:border-violetx-500/40',
                pageType === 'canvas' &&
                  'border-violetx-400 bg-violetx-50 text-violetx-700 dark:border-violetx-500/60 dark:bg-violetx-500/15 dark:text-violetx-200',
              )}
            >
              <Layout className="h-4 w-4 flex-shrink-0" />
              <div>
                <div className="font-medium">Canvas</div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400">Excalidraw drawing</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPageType('note')}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white/80 p-3 text-left text-sm transition hover:border-violetx-300 hover:bg-white focus-ring dark:border-ink-700 dark:bg-ink-900/70 dark:hover:border-violetx-500/40',
                pageType === 'note' &&
                  'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-200',
              )}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <div>
                <div className="font-medium">Note</div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400">Markdown text editor</div>
              </div>
            </button>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Title
          </span>
          <Input
            autoFocus
            placeholder={pageType === 'note' ? 'My notes' : 'System architecture sketch'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Description (optional)
          </span>
          <Textarea
            rows={2}
            placeholder="A short summary."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {pageType === 'canvas' && (
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Canvas mode
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CANVAS_MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border border-ink-200 bg-white/80 p-3 text-left text-sm transition hover:border-violetx-300 hover:bg-white focus-ring dark:border-ink-700 dark:bg-ink-900/70 dark:hover:border-violetx-500/40',
                    mode === m.id &&
                      'border-violetx-400 bg-violetx-50 text-violetx-700 dark:border-violetx-500/60 dark:bg-violetx-500/15 dark:text-violetx-200',
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[11px] text-ink-500 dark:text-ink-400">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
