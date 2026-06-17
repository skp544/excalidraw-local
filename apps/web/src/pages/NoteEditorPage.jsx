import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Edit3, Moon, Sun, FileText, Check, Loader2,
} from 'lucide-react';

import { useBoard, useUpdateNoteContent } from '@/hooks/use-boards.js';
import { useThemeStore } from '@/stores/theme-store.js';
import { Logo } from '@/components/ui/Logo.jsx';
import { cn } from '@/lib/cn.js';

/* ── Markdown renderer ────────────────────────────────────────────────────── */

function processInline(raw) {
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/gs, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/gs, '<em>$1</em>');
  return s;
}

function mdToHtml(src) {
  if (!src) return '';

  // 1. Protect code blocks
  const blocks = [];
  let text = src.replace(/```(\w*)\n?([\s\S]*?)```/gm, (_, lang, code) => {
    const esc = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const i = blocks.length;
    blocks.push(`<pre data-lang="${lang || ''}"><code>${esc}</code></pre>`);
    return `\x00BLOCK${i}\x00`;
  });

  // 2. Line-by-line block parsing
  const lines = text.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  let paraLines = [];

  const flushPara = () => {
    if (paraLines.length) {
      const joined = paraLines.join('\n').trim();
      if (joined) html += `<p>${processInline(joined)}</p>`;
      paraLines = [];
    }
  };
  const flushList = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  for (const line of lines) {
    if (line.includes('\x00BLOCK')) {
      flushPara(); flushList();
      html += line.replace(/\x00BLOCK(\d+)\x00/g, (_, i) => blocks[+i]);
      continue;
    }

    let m;
    if ((m = line.match(/^(#{1,3}) (.+)/))) {
      flushPara(); flushList();
      const lvl = m[1].length;
      html += `<h${lvl}>${processInline(m[2])}</h${lvl}>`;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      flushPara(); flushList();
      html += '<hr>';
      continue;
    }
    if ((m = line.match(/^[-*+] (.+)/))) {
      flushPara();
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${processInline(m[1])}</li>`;
      continue;
    }
    if ((m = line.match(/^\d+\. (.+)/))) {
      flushPara();
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${processInline(m[1])}</li>`;
      continue;
    }
    if (!line.trim()) {
      flushPara(); flushList();
      continue;
    }
    flushList();
    paraLines.push(line);
  }
  flushPara();
  flushList();
  return html;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useBoard(id);
  const updateNote = useUpdateNoteContent();
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  const initializedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const textareaRef = useRef(null);

  const board = data?.board;

  useEffect(() => {
    if (board && !initializedRef.current) {
      setContent(board.noteContent ?? '');
      initializedRef.current = true;
    }
  }, [board]);

  const triggerSave = useCallback(
    (text) => {
      clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateNote.mutateAsync({ id, content: text });
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1800);
        } catch {
          setSaveState('idle');
        }
      }, 1200);
    },
    [id, updateNote],
  );

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    triggerSave(text);
  };

  // Tab inserts 2 spaces
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = content.slice(0, start) + '  ' + content.slice(end);
      setContent(newVal);
      triggerSave(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  // Flush save on unload
  useEffect(() => {
    const flush = () => {
      if (saveState === 'saving') {
        clearTimeout(saveTimerRef.current);
        const blob = new Blob([JSON.stringify({ content })], { type: 'application/json' });
        navigator.sendBeacon?.(`/api/v1/boards/${id}/note`, blob);
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      clearTimeout(saveTimerRef.current);
    };
  }, [id, content, saveState]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-ink-950">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-ink-950">
      {/* ── Header ── */}
      <header className="z-10 flex h-14 flex-shrink-0 items-center gap-3 border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/90">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <button onClick={() => navigate('/')} className="focus-ring rounded-xl">
          <Logo withWordmark={false} />
        </button>

        <div className="h-5 w-px bg-ink-200 dark:bg-ink-700" />

        <h1 className="flex-1 truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
          {board?.title || 'Untitled'}
        </h1>

        <span className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <FileText className="h-3 w-3" />
          Note
        </span>

        {/* Save indicator */}
        <div className="flex items-center gap-1 text-xs text-ink-400">
          {saveState === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveState === 'saved' && <Check className="h-3 w-3 text-emerald-500" />}
          {saveState === 'saving' && <span>Saving…</span>}
          {saveState === 'saved' && <span className="text-emerald-600 dark:text-emerald-400">Saved</span>}
        </div>

        {/* Edit / Preview toggle */}
        <div className="flex items-center rounded-lg border border-ink-200/70 bg-ink-100/50 p-0.5 dark:border-ink-700/60 dark:bg-ink-800/50">
          <button
            onClick={() => { setViewMode('edit'); setTimeout(() => textareaRef.current?.focus(), 50); }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
              viewMode === 'edit'
                ? 'bg-white shadow-soft text-ink-800 dark:bg-ink-700 dark:text-ink-100'
                : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200',
            )}
          >
            <Edit3 className="h-3 w-3" />
            Write
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
              viewMode === 'preview'
                ? 'bg-white shadow-soft text-ink-800 dark:bg-ink-700 dark:text-ink-100'
                : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200',
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>

        <button
          onClick={cycleTheme}
          className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
          title="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* ── Main ── */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={`# My notes\n\nStart writing in Markdown...\n\nTips:\n- **Bold**, *italic*, \`inline code\`\n- \`\`\`code blocks\`\`\`\n- ## Headings, - lists`}
            spellCheck
            className={cn(
              'h-full min-h-full w-full resize-none border-none px-[max(2rem,calc(50%-380px))] py-10',
              'bg-white text-base leading-relaxed text-ink-800 outline-none',
              'dark:bg-ink-950 dark:text-ink-100',
              'font-[system-ui,sans-serif] placeholder:text-ink-300 dark:placeholder:text-ink-700',
            )}
          />
        ) : (
          <div
            className={cn(
              'min-h-full px-[max(2rem,calc(50%-380px))] py-10 text-ink-800 dark:text-ink-100',
              // Heading sizes
              '[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight',
              '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold',
              '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold',
              // Paragraphs
              '[&_p]:mb-4 [&_p]:leading-7',
              // Lists
              '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
              '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
              '[&_li]:mb-1 [&_li]:leading-relaxed',
              // Code
              '[&_code]:rounded [&_code]:bg-ink-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-ink-700',
              'dark:[&_code]:bg-ink-800 dark:[&_code]:text-[#7ee787]',
              // Code blocks
              '[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#1e1e2e] [&_pre]:p-5',
              '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm [&_pre_code]:text-[#7ee787]',
              // Misc
              '[&_hr]:my-6 [&_hr]:border-ink-200 dark:[&_hr]:border-ink-700',
              '[&_strong]:font-semibold',
              '[&_em]:italic',
              '[&_a]:text-violetx-600 [&_a]:underline hover:[&_a]:text-violetx-800',
              'dark:[&_a]:text-violetx-400 dark:hover:[&_a]:text-violetx-200',
            )}
            dangerouslySetInnerHTML={{ __html: mdToHtml(content) || '<p class="text-ink-300 dark:text-ink-700">Nothing to preview yet.</p>' }}
          />
        )}
      </div>
    </div>
  );
}
