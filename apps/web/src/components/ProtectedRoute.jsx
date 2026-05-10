import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store.js';
import { Spinner } from '@/components/ui/Spinner.jsx';

export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      if (accessToken) {
        setChecking(false);
        return;
      }
      if (refreshToken) {
        try {
          await refreshSession();
        } catch {
          logout();
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, refreshToken, refreshSession, logout]);

  if (!hydrated || checking) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner size={20} />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
