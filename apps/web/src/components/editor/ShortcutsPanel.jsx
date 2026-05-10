import { Modal } from '@/components/ui/Modal.jsx';

const GROUPS = [
  {
    name: 'Editor',
    items: [
      ['⌘ / Ctrl + S', 'Save now'],
      ['⌘ / Ctrl + K', 'Open command palette'],
      ['⌘ / Ctrl + Shift + N', 'New board'],
      ['⌘ / Ctrl + E', 'Export PNG'],
      ['?', 'Show this panel'],
      ['Esc', 'Exit presentation / dialogs'],
    ],
  },
  {
    name: 'Drawing',
    items: [
      ['V', 'Selection tool'],
      ['R', 'Rectangle'],
      ['O', 'Ellipse'],
      ['L / A', 'Line / Arrow'],
      ['T', 'Text'],
      ['P', 'Pencil'],
      ['Shift + drag', 'Constrain proportions'],
      ['Alt + drag', 'Duplicate'],
    ],
  },
];

export function ShortcutsPanel({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" className="max-w-2xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.name}>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              {group.name}
            </h4>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {group.items.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-ink-600 dark:text-ink-300">{v}</span>
                  <kbd className="rounded-md border border-ink-200 bg-white/70 px-1.5 py-0.5 font-mono text-[11px] text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                    {k}
                  </kbd>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
