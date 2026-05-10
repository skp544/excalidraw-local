import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import axios from 'axios';

import { AuthLayout } from '@/features/auth/AuthLayout.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { useAuthStore } from '@/stores/auth-store.js';
import { apiError } from '@/lib/api.js';

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post(`${baseURL}/auth/login`, { email, password });
      setSession(data);
      toast.success('Welcome back');
      const next = location.state?.from?.pathname ?? '/';
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to open your boards.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Email
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@local.host"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Password
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>
        </label>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Spinner size={14} className="text-white/90" /> : <ArrowRight className="h-4 w-4" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
        New here?{' '}
        <Link to="/register" className="font-medium text-violetx-600 hover:underline dark:text-violetx-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
