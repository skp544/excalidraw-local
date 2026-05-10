import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store.js';

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);

    if (error.response?.status === 401 && !original.url.includes('/auth/')) {
      original._retry = true;
      const { refreshToken, refreshSession, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }
      try {
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        original.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
        return api.request(original);
      } catch (err) {
        logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);

export const apiError = (err) =>
  err?.response?.data?.error?.message ?? err?.message ?? 'Something went wrong';
