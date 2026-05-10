import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const apply = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
};

export const useThemeStore = create()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        apply(theme);
      },
      cycleTheme: () => {
        const order = ['light', 'dark', 'system'];
        const next = order[(order.indexOf(get().theme) + 1) % order.length];
        get().setTheme(next);
      },
      hydrate: () => apply(get().theme),
    }),
    {
      name: 'excalidrow.theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

if (typeof window !== 'undefined') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') apply('system');
  });
}
