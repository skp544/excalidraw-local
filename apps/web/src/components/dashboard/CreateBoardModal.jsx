import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutTemplate, GitBranch, KanbanSquare, BrainCircuit, StickyNote } from 'lucide-react';

import { Modal } from '@/components/ui/Modal.jsx';
import { Input, Textarea } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useCreateBoard } from '@/hooks/use-boards.js';
import { apiError } from '@/lib/api.js';
import { cn } from '@/lib/cn.js';

const MODES = [
  { id: 'free', label: 'Freeform', icon: LayoutTemplate, hint: 'A blank infinite canvas.' },
  { id: 'architecture', label: 'Architecture', icon: GitBranch, hint: 'Diagrams and system design.' },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare, hint: 'Cards and lanes for planning.' },
  { id: 'mindmap', label: 'Mindmap', icon: BrainCircuit, hint: 'Branching ideas from a core.' },
  { id: 'notes', label: 'Notes', icon: StickyNote, hint: 'Sticky-note brainstorm canvas.' },
];

export function CreateBoardModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('free');
  const create = useCreateBoard();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const data = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        mode,
      });
      toast.success('Board created');
      onClose?.();
      setTitle('');
      setDescription('');
      setMode('free');
      navigate(`/board/${data.board.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new board"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={create.isPending || !title.trim()}>
            {create.isPending ? 'Creating…' : 'Create board'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Title
          </span>
          <Input
            autoFocus
            placeholder="System architecture sketch"
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
            placeholder="A short summary so future you knows what this is."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Mode
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
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
      </form>
    </Modal>
  );
}
