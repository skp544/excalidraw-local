import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { Topbar } from '@/components/dashboard/Topbar.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useCreateBoard, useUpdatePage } from '@/hooks/use-boards.js';
import { apiError } from '@/lib/api.js';
import { cn } from '@/lib/cn.js';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/templates.js';

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [loadingId, setLoadingId] = useState(null);
  const create = useCreateBoard();
  const updatePage = useUpdatePage();
  const navigate = useNavigate();

  const filtered = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  const onChoose = async (tpl) => {
    setLoadingId(tpl.id);
    try {
      const res = await create.mutateAsync({
        title: tpl.title,
        description: tpl.description,
        mode: tpl.mode,
        template: tpl.id,
      });

      const boardId = res.board.id;
      const pageId  = res.pages?.[0]?.id;

      // Inject template elements into the first page
      if (pageId && tpl.elements) {
        await updatePage.mutateAsync({
          boardId,
          pageId,
          scene: {
            elements: tpl.elements(),
            appState: {},
            files: {},
          },
        });
      }

      toast.success(`"${tpl.title}" board ready`);
      navigate(`/board/${boardId}`, { state: pageId ? { pageId } : undefined });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <Topbar
        title="Templates"
        subtitle="Pick a starting point — everything is editable once you're in the editor"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                activeCategory === cat.id
                  ? 'border-violetx-400 bg-violetx-50 text-violetx-700 dark:border-violetx-500/60 dark:bg-violetx-500/15 dark:text-violetx-200'
                  : 'border-ink-200/70 bg-white/80 text-ink-600 hover:border-violetx-300 hover:text-violetx-600 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-300',
              )}
            >
              {cat.label}
              {cat.id !== 'all' && (
                <span className="ml-1.5 text-xs opacity-60">
                  {TEMPLATES.filter((t) => t.category === cat.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.ul
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                loading={loadingId === tpl.id}
                disabled={loadingId !== null}
                onChoose={onChoose}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </>
  );
}

function TemplateCard({ tpl, loading, disabled, onChoose }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white/85 shadow-soft transition hover:-translate-y-0.5 hover:border-violetx-300 hover:shadow-ring dark:border-ink-700/60 dark:bg-ink-900/60 dark:hover:border-violetx-500/40"
    >
      {/* Preview area */}
      <div
        className={cn(
          'relative aspect-[16/9] overflow-hidden bg-gradient-to-br',
          tpl.gradient,
        )}
      >
        <TemplatePreview tpl={tpl} />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/10">
          <span className="scale-90 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-violetx-700 opacity-0 shadow-ring transition group-hover:scale-100 group-hover:opacity-100 dark:bg-ink-900/90 dark:text-violetx-300">
            Use template
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold tracking-tight leading-snug">
            {tpl.title}
          </h3>
          <span className={cn(
            'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            'border-ink-200/70 text-ink-500 dark:border-ink-700/60 dark:text-ink-400',
          )}>
            {tpl.category}
          </span>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {tpl.description}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {tpl.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-ink-100/80 px-2 py-0.5 text-[11px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <Button
          onClick={() => onChoose(tpl)}
          disabled={disabled}
          className="mt-2 self-start"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating…
            </>
          ) : 'Use template'}
        </Button>
      </div>
    </motion.li>
  );
}

/* ── Miniature SVG previews per category ─────────────────────────────── */
function TemplatePreview({ tpl }) {
  const previews = {
    flowchart: <FlowPreview />,
    kanban:    <KanbanPreview />,
    mindmap:   <MindPreview />,
    swot:      <SwotPreview />,
    retro:     <RetroPreview />,
    'system-arch': <ArchPreview />,
    wireframe: <WirePreview />,
    roadmap:   <RoadmapPreview />,
    erd:       <ErdPreview />,
    brainstorm: <BrainstormPreview />,
    'user-story-map': <StoryMapPreview />,
    sequence:  <SequencePreview />,
    'command-ref': <CommandRefPreview />,
  };
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {previews[tpl.id] ?? <DefaultPreview />}
    </div>
  );
}

const SV = ({ children, vb = '0 0 200 120' }) => (
  <svg viewBox={vb} className="h-full w-full max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

function FlowPreview() {
  return <SV>
    <ellipse cx="100" cy="12" rx="40" ry="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5"/>
    <text x="100" y="16" textAnchor="middle" fontSize="9" fill="#166534">Start</text>
    <line x1="100" y1="24" x2="100" y2="38" stroke="#1e1e2e" strokeWidth="1.5" markerEnd="url(#arr)"/>
    <rect x="70" y="38" width="60" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5"/>
    <text x="100" y="53" textAnchor="middle" fontSize="8" fill="#1e40af">Process</text>
    <line x1="100" y1="60" x2="100" y2="74" stroke="#1e1e2e" strokeWidth="1.5"/>
    <polygon points="100,74 130,90 100,106 70,90" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"/>
    <text x="100" y="93" textAnchor="middle" fontSize="8" fill="#92400e">Decision?</text>
    <line x1="70" y1="90" x2="40" y2="90" stroke="#1e1e2e" strokeWidth="1.5"/>
    <rect x="12" y="80" width="28" height="20" rx="3" fill="#ffe4e6" stroke="#e11d48" strokeWidth="1.5"/>
    <text x="26" y="93" textAnchor="middle" fontSize="7" fill="#be123c">No</text>
    <line x1="130" y1="90" x2="158" y2="90" stroke="#1e1e2e" strokeWidth="1.5"/>
    <ellipse cx="172" cy="90" rx="18" ry="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5"/>
    <text x="172" y="94" textAnchor="middle" fontSize="7" fill="#166534">End</text>
    <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#1e1e2e"/></marker></defs>
  </SV>;
}

function KanbanPreview() {
  const cols = [['#f1f5f9','#475569'], ['#ede9fe','#7c3aed'], ['#dcfce7','#16a34a']];
  const labels = ['To Do', 'In Progress', 'Done'];
  return <SV>
    {cols.map(([bg, stroke], i) => (
      <g key={i}>
        <rect x={10 + i*64} y="8" width="58" height="18" rx="4" fill={bg} stroke={stroke} strokeWidth="1.5"/>
        <text x={10 + i*64 + 29} y="21" textAnchor="middle" fontSize="7" fill={stroke}>{labels[i]}</text>
        {[32,50,68].map((y, j) => j < (i===1?2:3) && (
          <rect key={j} x={14 + i*64} y={y} width="50" height="13" rx="3" fill="white" stroke={stroke} strokeWidth="1" opacity="0.8"/>
        ))}
      </g>
    ))}
  </SV>;
}

function MindPreview() {
  const branches = [
    { x: 60, y: 30, color: '#2563eb', label: 'Research' },
    { x: 155, y: 30, color: '#7c3aed', label: 'Design' },
    { x: 175, y: 70, color: '#16a34a', label: 'Dev' },
    { x: 155, y: 110, color: '#d97706', label: 'Test' },
    { x: 60, y: 110, color: '#e11d48', label: 'Launch' },
    { x: 30, y: 70, color: '#0284c7', label: 'Market' },
  ];
  return <SV>
    <ellipse cx="100" cy="70" rx="32" ry="20" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="74" textAnchor="middle" fontSize="9" fill="#5b21b6" fontWeight="600">Topic</text>
    {branches.map(({ x, y, color, label }) => (
      <g key={label}>
        <line x1="100" y1="70" x2={x} y2={y} stroke={color} strokeWidth="1.5"/>
        <ellipse cx={x} cy={y} rx="22" ry="13" fill="white" stroke={color} strokeWidth="1.5"/>
        <text x={x} y={y+4} textAnchor="middle" fontSize="7" fill={color}>{label}</text>
      </g>
    ))}
  </SV>;
}

function SwotPreview() {
  const q = [
    { x:6,  y:6,  bg:'#dcfce7', s:'#16a34a', l:'Strengths' },
    { x:104,y:6,  bg:'#ffe4e6', s:'#e11d48', l:'Weaknesses' },
    { x:6,  y:64, bg:'#dbeafe', s:'#2563eb', l:'Opportunities' },
    { x:104,y:64, bg:'#fef3c7', s:'#d97706', l:'Threats' },
  ];
  return <SV>
    <line x1="100" y1="0" x2="100" y2="120" stroke="#94a3b8" strokeWidth="1.5"/>
    <line x1="0" y1="62" x2="200" y2="62" stroke="#94a3b8" strokeWidth="1.5"/>
    {q.map(({ x, y, bg, s, l }) => (
      <g key={l}>
        <rect x={x} y={y} width="90" height="52" rx="4" fill={bg} stroke={s} strokeWidth="1.5"/>
        <text x={x+45} y={y+17} textAnchor="middle" fontSize="8" fill={s} fontWeight="600">{l}</text>
        <line x1={x+12} y1={y+28} x2={x+78} y2={y+28} stroke={s} strokeWidth="0.5" opacity="0.4"/>
        <line x1={x+12} y1={y+38} x2={x+60} y2={y+38} stroke={s} strokeWidth="0.5" opacity="0.4"/>
      </g>
    ))}
  </SV>;
}

function RetroPreview() {
  const cols = [
    { x:6,  bg:'#dcfce7', s:'#16a34a', l:'Went Well' },
    { x:72, bg:'#fef3c7', s:'#d97706', l:'Improve' },
    { x:138,bg:'#dbeafe', s:'#2563eb', l:'Actions' },
  ];
  return <SV>
    {cols.map(({ x, bg, s, l }) => (
      <g key={l}>
        <rect x={x} y="6" width="58" height="108" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x={x} y="6" width="58" height="20" rx="4" fill={bg} stroke={s} strokeWidth="1.5"/>
        <text x={x+29} y="20" textAnchor="middle" fontSize="7" fill={s}>{l}</text>
        {[32,52,72,92].map((y) => (
          <rect key={y} x={x+4} y={y} width="50" height="14" rx="3" fill={bg} stroke={s} strokeWidth="1" opacity="0.7"/>
        ))}
      </g>
    ))}
  </SV>;
}

function ArchPreview() {
  return <SV>
    {[['Client',20,50,'#e0f2fe','#0284c7'],['Gateway',80,50,'#ede9fe','#7c3aed'],
      ['Auth',140,20,'#dcfce7','#16a34a'],['Board',140,55,'#dcfce7','#16a34a'],
      ['DB',185,38,'#ffedd5','#ea580c']].map(([l,x,y,bg,s])=>(
      <g key={l}>
        <rect x={x} y={y} width="48" height="22" rx="4" fill={bg} stroke={s} strokeWidth="1.5"/>
        <text x={x+24} y={y+15} textAnchor="middle" fontSize="8" fill={s}>{l}</text>
      </g>
    ))}
    <line x1="68" y1="61" x2="80" y2="61" stroke="#475569" strokeWidth="1.5" markerEnd="url(#a2)"/>
    <line x1="128" y1="61" x2="140" y2="67" stroke="#475569" strokeWidth="1" markerEnd="url(#a2)"/>
    <line x1="128" y1="61" x2="140" y2="31" stroke="#475569" strokeWidth="1" markerEnd="url(#a2)"/>
    <line x1="188" y1="49" x2="185" y2="49" stroke="#475569" strokeWidth="1" markerEnd="url(#a2)"/>
    <defs><marker id="a2" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#475569"/></marker></defs>
  </SV>;
}

function WirePreview() {
  return <SV>
    <rect x="4" y="4" width="192" height="14" rx="2" fill="#1e1e2e"/>
    <rect x="4" y="22" width="192" height="40" rx="2" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
    <rect x="70" y="27" width="60" height="10" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1"/>
    <text x="100" y="35" textAnchor="middle" fontSize="7" fill="#5b21b6">Hero Title</text>
    <rect x="80" y="42" width="24" height="10" rx="2" fill="#7c3aed"/>
    <rect x="108" y="42" width="24" height="10" rx="2" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
    {[22,80,138].map((x)=>(
      <rect key={x} x={x} y="68" width="52" height="44" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    ))}
    <rect x="4" y="116" width="192" height="10" rx="2" fill="#1e1e2e"/>
  </SV>;
}

function RoadmapPreview() {
  return <SV>
    <line x1="10" y1="60" x2="190" y2="60" stroke="#1e1e2e" strokeWidth="2"/>
    {[24,70,116,162].map((x,i)=>(
      <g key={i}>
        <line x1={x} y1="52" x2={x} y2="68" stroke="#1e1e2e" strokeWidth="2"/>
        <text x={x} y="80" textAnchor="middle" fontSize="8" fill="#475569">Q{i+1}</text>
      </g>
    ))}
    {[[10,32,80,'#ede9fe','#7c3aed'],[56,16,70,'#dbeafe','#2563eb'],
      [102,32,72,'#dcfce7','#16a34a'],[148,16,72,'#fef3c7','#d97706']].map(([x,y,w,bg,s],i)=>(
      <g key={i}>
        <rect x={x} y={y} width={w} height="20" rx="4" fill={bg} stroke={s} strokeWidth="1.5"/>
        <line x1={x+w/2} y1={y+20} x2={x+w/2} y2="60" stroke={s} strokeWidth="1" strokeDasharray="3,2"/>
      </g>
    ))}
  </SV>;
}

function ErdPreview() {
  const entities = [
    { x:6,  y:20, label:'User',   color:'#7c3aed', bg:'#ede9fe', fields:['id','email','hash'] },
    { x:80, y:20, label:'Board',  color:'#2563eb', bg:'#dbeafe', fields:['id','title','owner'] },
    { x:80, y:80, label:'Page',   color:'#16a34a', bg:'#dcfce7', fields:['id','title'] },
    { x:155,y:50, label:'Folder', color:'#d97706', bg:'#fef3c7', fields:['id','name'] },
  ];
  return <SV>
    {entities.map(({ x, y, label, color, bg, fields }) => (
      <g key={label}>
        <rect x={x} y={y} width="66" height="14" rx="2" fill={bg} stroke={color} strokeWidth="1.5"/>
        <text x={x+33} y={y+10} textAnchor="middle" fontSize="8" fill={color} fontWeight="700">{label}</text>
        {fields.map((f, i) => (
          <g key={f}>
            <rect x={x} y={y+14+i*11} width="66" height="11" rx="0" fill="white" stroke="#e2e8f0" strokeWidth="0.5"/>
            <text x={x+4} y={y+22+i*11} fontSize="7" fill="#475569">{f}</text>
          </g>
        ))}
      </g>
    ))}
    <line x1="72" y1="30" x2="80" y2="30" stroke="#7c3aed" strokeWidth="1" strokeDasharray="3,2"/>
    <line x1="114" y1="50" x2="155" y2="70" stroke="#2563eb" strokeWidth="1" strokeDasharray="3,2"/>
    <line x1="100" y1="50" x2="100" y2="80" stroke="#2563eb" strokeWidth="1" strokeDasharray="3,2"/>
  </SV>;
}

function BrainstormPreview() {
  const ideas = [
    [50,18,'#dbeafe','#2563eb'],[130,18,'#dcfce7','#16a34a'],
    [164,60,'#fef3c7','#d97706'],[130,102,'#ffe4e6','#e11d48'],
    [50,102,'#ccfbf1','#0d9488'],[16,60,'#e0e7ff','#4338ca'],
  ];
  return <SV>
    <ellipse cx="100" cy="60" rx="30" ry="18" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="64" textAnchor="middle" fontSize="9" fill="#5b21b6" fontWeight="600">Idea</text>
    {ideas.map(([x, y, bg, s], i) => (
      <g key={i}>
        <line x1="100" y1="60" x2={x} y2={y} stroke={s} strokeWidth="1" strokeDasharray="3,2"/>
        <ellipse cx={x} cy={y} rx="22" ry="13" fill={bg} stroke={s} strokeWidth="1.5"/>
      </g>
    ))}
  </SV>;
}

function StoryMapPreview() {
  const cols = ['#7c3aed','#2563eb','#16a34a','#d97706'];
  return <SV>
    {cols.map((c, i) => (
      <g key={i}>
        <rect x={6+i*48} y="6" width="42" height="16" rx="3" fill={c} opacity="0.2" stroke={c} strokeWidth="1.5"/>
        <rect x={6+i*48} y="28" width="42" height="12" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1"/>
        {[46,62,78,94].map((y) => (
          <rect key={y} x={8+i*48} y={y} width="38" height="12" rx="2" fill={c} opacity="0.15" stroke={c} strokeWidth="1"/>
        ))}
      </g>
    ))}
    <text x="4" y="17" fontSize="6" fill="#475569" textAnchor="start">Activities</text>
    <text x="4" y="37" fontSize="6" fill="#475569" textAnchor="start">Tasks</text>
    <text x="4" y="53" fontSize="6" fill="#475569" textAnchor="start">Stories</text>
  </SV>;
}

function SequencePreview() {
  const actors = [30, 80, 130, 175];
  const labels = ['Client','Gateway','Auth','DB'];
  const msgs = [[0,1,30],[1,2,46],[2,3,62],[3,2,74,true],[2,1,86,true],[1,0,98,true]];
  return <SV>
    {actors.map((x, i) => (
      <g key={i}>
        <rect x={x-22} y="4" width="44" height="16" rx="3" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5"/>
        <text x={x} y="16" textAnchor="middle" fontSize="7" fill="#475569">{labels[i]}</text>
        <line x1={x} y1="20" x2={x} y2="116" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2"/>
        <rect x={x-22} y="104" width="44" height="16" rx="3" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5"/>
        <text x={x} y="116" textAnchor="middle" fontSize="7" fill="#475569">{labels[i]}</text>
      </g>
    ))}
    {msgs.map(([f, t, y, ret], i) => {
      const x1 = actors[f], x2 = actors[t];
      return <line key={i} x1={x1} y1={y} x2={x2} y2={y}
        stroke="#7c3aed" strokeWidth="1.5"
        strokeDasharray={ret ? '4,2' : 'none'}
        markerEnd="url(#sm)"/>;
    })}
    <defs><marker id="sm" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#7c3aed"/></marker></defs>
  </SV>;
}

function CommandRefPreview() {
  const rows = [
    { cmd: 'ls -la', desc: 'List all files with permissions' },
    { cmd: 'git status', desc: 'Show working tree status' },
    { cmd: 'npm run dev', desc: 'Start development server' },
  ];
  return (
    <SV vb="0 0 200 130">
      {/* Title bar */}
      <rect x="4" y="4" width="192" height="18" rx="3" fill="#1e1e2e" stroke="#4a4a6a" strokeWidth="0.75"/>
      <text x="10" y="16" fontSize="7" fill="#7ee787" fontFamily="monospace"># Command Reference</text>

      {/* Snippet cards */}
      {rows.map(({ cmd, desc }, i) => (
        <g key={i}>
          <rect x="4" y={28 + i * 34} width="192" height="14" rx="2" fill="#1e1e2e" stroke="#4a4a6a" strokeWidth="0.75"/>
          <text x="9" y={38 + i * 34} fontSize="7" fill="#7ee787" fontFamily="monospace">$ {cmd}</text>
          <rect x="4" y={42 + i * 34} width="192" height="13" rx="0" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5"/>
          <text x="9" y={51 + i * 34} fontSize="6.5" fill="#475569">{desc}</text>
        </g>
      ))}
    </SV>
  );
}

function DefaultPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-40">
      <svg viewBox="0 0 100 60" className="h-20 w-20" fill="none">
        <rect x="10" y="10" width="80" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
        <line x1="10" y1="24" x2="90" y2="24" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}
