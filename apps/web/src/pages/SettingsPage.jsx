import { useState } from 'react';
import toast from 'react-hot-toast';

import { Topbar } from '@/components/dashboard/Topbar.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/stores/auth-store.js';
import { useThemeStore } from '@/stores/theme-store.js';
import { api, apiError } from '@/lib/api.js';
import { cn } from '@/lib/cn.js';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const prefs = user?.preferences ?? {};

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch('/auth/me', { name });
      setUser(data.user);
      toast.success('Saved');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const updatePref = async (patch) => {
    try {
      const { data } = await api.patch('/auth/me', {
        preferences: { ...prefs, ...patch },
      });
      setUser(data.user);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken });
    } catch {
      /* ignore */
    }
    logout();
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Your studio preferences" />
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="mx-auto max-w-2xl space-y-6">
          <Section title="Profile">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Name
              </span>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Email
              </span>
              <Input value={user?.email ?? ''} readOnly />
            </label>
            <Button onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </Button>
          </Section>

          <Section title="Theme">
            <div className="flex gap-2">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'rounded-xl border border-ink-200 bg-white/80 px-4 py-2 text-sm font-medium capitalize text-ink-700 transition hover:border-violetx-300 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-200',
                    theme === t &&
                      'border-violetx-400 bg-violetx-50 text-violetx-700 dark:border-violetx-500/60 dark:bg-violetx-500/15 dark:text-violetx-200',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Editor preferences">
            <Toggle
              label="Snap to grid"
              hint="Snap shapes to a 20px grid while drawing."
              checked={prefs.snapToGrid ?? false}
              onChange={(v) => updatePref({ snapToGrid: v })}
            />
            <Toggle
              label="Show grid"
              hint="Subtle dot grid on the canvas."
              checked={prefs.showGrid ?? true}
              onChange={(v) => updatePref({ showGrid: v })}
            />
            <Toggle
              label="Reduce motion"
              hint="Disable non-essential animations across the app."
              checked={prefs.reduceMotion ?? false}
              onChange={(v) => updatePref({ reduceMotion: v })}
            />
          </Section>

          <Section title="Session">
            <Button variant="danger" onClick={onLogout}>
              Sign out
            </Button>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-ink-200/70 bg-white/70 p-5 shadow-soft dark:border-ink-700/60 dark:bg-ink-900/60">
      <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/40"
    >
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-ink-500 dark:text-ink-400">{hint}</div>}
      </div>
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition',
          checked ? 'bg-violetx-500' : 'bg-ink-200 dark:bg-ink-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
            checked ? 'left-4' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
