import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { ProtectedRoute } from '@/components/ProtectedRoute.jsx';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout.jsx';
import { DashboardPage } from '@/pages/DashboardPage.jsx';
import { ActivityPage } from '@/pages/ActivityPage.jsx';
import { TemplatesPage } from '@/pages/TemplatesPage.jsx';
import { SettingsPage } from '@/pages/SettingsPage.jsx';
import { LoginPage } from '@/pages/LoginPage.jsx';
import { RegisterPage } from '@/pages/RegisterPage.jsx';
import { BoardEditorPage } from '@/pages/BoardEditorPage.jsx';
import { useThemeStore } from '@/stores/theme-store.js';

export default function App() {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/board/:id" element={<BoardEditorPage />} />
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          className:
            '!bg-white/95 !text-ink-800 !border !border-ink-200/70 !shadow-soft dark:!bg-ink-900/95 dark:!text-ink-100 dark:!border-ink-700/70',
          style: { borderRadius: '14px', padding: '10px 14px', fontSize: '13px' },
        }}
      />
    </>
  );
}
