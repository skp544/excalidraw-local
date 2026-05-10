import { Topbar } from '@/components/dashboard/Topbar.jsx';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, KanbanSquare, BrainCircuit, GitBranch, StickyNote } from 'lucide-react';
import { useCreateBoard } from '@/hooks/use-boards.js';
import toast from 'react-hot-toast';
import { apiError } from '@/lib/api.js';
import { Button } from '@/components/ui/Button.jsx';

const TEMPLATES = [
  {
    id: 'flowchart',
    title: 'Flowchart starter',
    description: 'Boxes, arrows, decision diamonds — pre-arranged.',
    icon: GitBranch,
    mode: 'architecture',
  },
  {
    id: 'kanban',
    title: 'Kanban board',
    description: 'Three-lane board for planning your week.',
    icon: KanbanSquare,
    mode: 'kanban',
  },
  {
    id: 'mindmap',
    title: 'Mindmap',
    description: 'Branching ideas around a single core.',
    icon: BrainCircuit,
    mode: 'mindmap',
  },
  {
    id: 'sticky',
    title: 'Sticky brainstorm',
    description: 'Free-form sticky notes on a soft grid.',
    icon: StickyNote,
    mode: 'notes',
  },
  {
    id: 'system',
    title: 'System architecture',
    description: 'A starting point for service-oriented diagrams.',
    icon: LayoutTemplate,
    mode: 'architecture',
  },
];

export function TemplatesPage() {
  const create = useCreateBoard();
  const navigate = useNavigate();

  const onChoose = async (tpl) => {
    try {
      const res = await create.mutateAsync({
        title: `${tpl.title}`,
        description: tpl.description,
        mode: tpl.mode,
        template: tpl.id,
      });
      toast.success('Template ready');
      navigate(`/board/${res.board.id}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <>
      <Topbar title="Templates" subtitle="Start a board with a head-start" />
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <li
              key={tpl.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white/80 shadow-soft transition hover:-translate-y-0.5 hover:border-violetx-300 dark:border-ink-700/60 dark:bg-ink-900/60 dark:hover:border-violetx-500/40"
            >
              <div className="grid aspect-[16/10] place-items-center bg-gradient-to-br from-violetx-100 via-white to-indigo-100 text-violetx-700 dark:from-violetx-900/30 dark:via-ink-900 dark:to-indigo-900/30 dark:text-violetx-200">
                <tpl.icon className="h-10 w-10" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-base font-semibold tracking-tight">{tpl.title}</h3>
                <p className="flex-1 text-sm text-ink-500 dark:text-ink-400">{tpl.description}</p>
                <Button onClick={() => onChoose(tpl)} className="self-start">
                  Use template
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
