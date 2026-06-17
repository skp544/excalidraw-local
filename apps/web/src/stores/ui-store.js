import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      sidebarWidth: 268,
      setSidebarWidth: (w) => set({ sidebarWidth: w }),

      commandPaletteOpen: false,
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      shortcutsOpen: false,
      openShortcuts: () => set({ shortcutsOpen: true }),
      closeShortcuts: () => set({ shortcutsOpen: false }),

      view: 'grid', // 'grid' | 'list'
      setView: (view) => set({ view }),
    }),
    {
      name: 'excalidrow.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarWidth: s.sidebarWidth, sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
