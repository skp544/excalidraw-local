import { useEffect } from 'react';

/**
 * Lightweight, single-callback hotkey hook. Combo strings use '+' separator
 * with modifiers `mod` (cmd/ctrl), `shift`, `alt`. Examples: "mod+k", "shift+/".
 */
export function useHotkeys(combo, handler, deps = []) {
  useEffect(() => {
    const combos = (Array.isArray(combo) ? combo : [combo]).map((c) => parseCombo(c));
    const onKey = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      const editable = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      for (const c of combos) {
        if (c.allowInInputs !== true && editable) continue;
        if (matches(c, e)) {
          handler(e);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function parseCombo(str) {
  const parts = str.toLowerCase().split('+').map((s) => s.trim());
  const allowInInputs = parts.includes('!input');
  const filtered = parts.filter((p) => p !== '!input');
  return {
    mod: filtered.includes('mod') || filtered.includes('cmd') || filtered.includes('ctrl'),
    shift: filtered.includes('shift'),
    alt: filtered.includes('alt'),
    key: filtered.find((p) => !['mod', 'cmd', 'ctrl', 'shift', 'alt'].includes(p)) ?? '',
    allowInInputs,
  };
}

function matches(c, e) {
  const pressed = (e.metaKey || e.ctrlKey);
  return (
    (!c.mod || pressed) &&
    c.shift === e.shiftKey &&
    c.alt === e.altKey &&
    e.key.toLowerCase() === c.key
  );
}
