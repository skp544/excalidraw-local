import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { CreateBoardModal } from './CreateBoardModal.jsx';
import { useUIStore } from '@/stores/ui-store.js';
import { useHotkeys } from '@/hooks/use-hotkeys.js';

export function DashboardLayout() {
  const [createOpen, setCreateOpen] = useState(false);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    toggleCommandPalette();
  });
  useHotkeys('mod+shift+n', (e) => {
    e.preventDefault();
    setCreateOpen(true);
  });

  return (
    <div className="grid h-full grid-cols-[auto_1fr] bg-canvas-light dark:bg-canvas-dark">
      <Sidebar
        onCreateBoard={() => setCreateOpen(true)}
        onOpenCommandPalette={openCommandPalette}
      />
      <main className="relative flex h-full min-w-0 flex-col overflow-hidden">
        <Outlet context={{ onCreateBoard: () => setCreateOpen(true) }} />
      </main>

      <CommandPalette onCreateBoard={() => setCreateOpen(true)} />
      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
