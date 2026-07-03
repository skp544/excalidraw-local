import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, FileText, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useBoard, useUpdateNoteContent, useUpdateBoard } from '@/hooks/use-boards.js';
import { useThemeStore } from '@/stores/theme-store.js';
import { Logo } from '@/components/ui/Logo.jsx';
import { apiError } from '@/lib/api.js';
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

/* ── Block helpers ────────────────────────────────────────────────────────── */

/** Splits note content into editable blocks — one per line, except fenced
 * code blocks (```...```) which stay together as a single multi-line block. */
function splitBlocks(text) {
  if (!text) return [''];
  const rawLines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    if (/^```/.test(line.trim())) {
      let j = i + 1;
      while (j < rawLines.length && !/^```/.test(rawLines[j].trim())) j++;
      const end = j < rawLines.length ? j : j - 1;
      blocks.push(rawLines.slice(i, end + 1).join('\n'));
      i = end + 1;
    } else {
      blocks.push(line);
      i += 1;
    }
  }
  return blocks.length ? blocks : [''];
}

function blockTextClass(block) {
  if (/^### /.test(block)) return 'text-xl font-semibold leading-snug';
  if (/^## /.test(block)) return 'text-2xl font-semibold leading-snug';
  if (/^# /.test(block)) return 'text-3xl font-bold leading-tight';
  if (block.trim().startsWith('```')) {
    return 'whitespace-pre rounded-xl bg-[#1e1e2e] p-5 font-mono text-sm leading-6 text-[#7ee787]';
  }
  return 'text-base leading-7';
}

const PROSE_CLASSES = cn(
  '[&_h1]:mb-1 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight',
  '[&_h2]:mb-1 [&_h2]:text-2xl [&_h2]:font-semibold',
  '[&_h3]:mb-1 [&_h3]:text-xl [&_h3]:font-semibold',
  '[&_p]:leading-7',
  '[&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:leading-relaxed',
  '[&_code]:rounded [&_code]:bg-ink-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-ink-700',
  'dark:[&_code]:bg-ink-800 dark:[&_code]:text-[#7ee787]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#1e1e2e] [&_pre]:p-5',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm [&_pre_code]:text-[#7ee787]',
  '[&_hr]:my-3 [&_hr]:border-ink-200 dark:[&_hr]:border-ink-700',
  '[&_strong]:font-semibold',
  '[&_em]:italic',
  '[&_a]:text-violetx-600 [&_a]:underline hover:[&_a]:text-violetx-800',
  'dark:[&_a]:text-violetx-400 dark:hover:[&_a]:text-violetx-200',
);

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useBoard(id);
  const updateNote = useUpdateNoteContent();
  const updateBoard = useUpdateBoard();
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [content, setContent] = useState('');
  const [activeBlock, setActiveBlock] = useState(null);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const initializedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const activeRef = useRef(null);
  const pendingCaretRef = useRef(null);
  const titleInputRef = useRef(null);

  const board = data?.board;
  const blocks = splitBlocks(content);

  useEffect(() => {
    if (board && !initializedRef.current) {
      const initial = board.noteContent ?? '';
      setContent(initial);
      setActiveBlock(initial ? null : 0);
      initializedRef.current = true;
    }
  }, [board]);

  useEffect(() => {
    if (activeBlock === null) return;
    const ta = activeRef.current;
    if (!ta) return;
    ta.focus();
    const caret = pendingCaretRef.current;
    pendingCaretRef.current = null;
    const pos = caret ?? ta.value.length;
    ta.selectionStart = ta.selectionEnd = pos;
  }, [activeBlock]);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  const triggerSave = useCallback(
    (text) => {
      clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateNote.mutateAsync({ id, content: text });
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1800);
        } catch (err) {
          setSaveState('idle');
          toast.error(apiError(err));
        }
      }, 1200);
    },
    [id, updateNote],
  );

  const updateBlock = (idx, value) => {
    const next = [...blocks];
    next[idx] = value;
    const newContent = next.join('\n');
    setContent(newContent);
    triggerSave(newContent);
  };

  const handleBlockKeyDown = (e, idx) => {
    const block = blocks[idx];
    const isFence = block.trim().startsWith('```');

    if (e.key === 'Enter' && !isFence) {
      e.preventDefault();
      const pos = e.target.selectionStart;
      const before = block.slice(0, pos);
      const after = block.slice(pos);
      const next = [...blocks];
      next.splice(idx, 1, before, after);
      const newContent = next.join('\n');
      setContent(newContent);
      triggerSave(newContent);
      pendingCaretRef.current = 0;
      setActiveBlock(idx + 1);
      return;
    }

    if (e.key === 'Backspace' && e.target.selectionStart === 0 && e.target.selectionEnd === 0 && idx > 0) {
      e.preventDefault();
      const prev = blocks[idx - 1];
      const next = [...blocks];
      next.splice(idx - 1, 2, prev + block);
      const newContent = next.join('\n');
      setContent(newContent);
      triggerSave(newContent);
      pendingCaretRef.current = prev.length;
      setActiveBlock(idx - 1);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = block.slice(0, start) + '  ' + block.slice(end);
      updateBlock(idx, newVal);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
      return;
    }

    if (e.key === 'Escape') {
      setActiveBlock(null);
    }
  };

  const appendBlock = () => {
    const next = [...blocks, ''];
    setContent(next.join('\n'));
    pendingCaretRef.current = 0;
    setActiveBlock(next.length - 1);
  };

  const startEditTitle = () => {
    setTitleValue(board?.title || 'Untitled');
    setEditingTitle(true);
  };

  const commitTitle = async () => {
    setEditingTitle(false);
    const name = titleValue.trim();
    if (!name || name === board?.title) return;
    try {
      await updateBoard.mutateAsync({ id, title: name });
    } catch (err) {
      toast.error(apiError(err));
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

        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="flex-1 truncate border-none bg-transparent text-sm font-semibold text-ink-800 outline-none dark:text-ink-100"
          />
        ) : (
          <h1
            onDoubleClick={startEditTitle}
            title="Double-click to rename"
            className="flex-1 cursor-text truncate text-sm font-semibold text-ink-800 dark:text-ink-100"
          >
            {board?.title || 'Untitled'}
          </h1>
        )}

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

        <button
          onClick={cycleTheme}
          className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
          title="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* ── Live markdown editor ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-10">
          {blocks.map((block, idx) =>
            activeBlock === idx ? (
              <textarea
                key={idx}
                ref={activeRef}
                value={block}
                onChange={(e) => updateBlock(idx, e.target.value)}
                onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                onBlur={() => setActiveBlock(null)}
                rows={block.split('\n').length}
                spellCheck
                placeholder={blocks.length === 1 && !block ? 'Start writing in Markdown…' : undefined}
                className={cn(
                  'block w-full resize-none overflow-hidden border-none bg-transparent p-0 outline-none',
                  'text-ink-800 placeholder:text-ink-300 dark:text-ink-100 dark:placeholder:text-ink-700',
                  blockTextClass(block),
                )}
              />
            ) : (
              <div
                key={idx}
                onClick={() => setActiveBlock(idx)}
                className={cn('min-h-[1.75rem] cursor-text text-ink-800 dark:text-ink-100', PROSE_CLASSES)}
                dangerouslySetInnerHTML={{ __html: mdToHtml(block) || '<p>&nbsp;</p>' }}
              />
            ),
          )}
          <div className="h-32 cursor-text" onClick={appendBlock} />
        </div>
      </div>
    </div>
  );
}
