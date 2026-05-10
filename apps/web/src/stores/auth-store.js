import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const initial = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  hydrated: false,
};

/**
 * Auth state lives in zustand with localStorage persistence so the app
 * survives reloads. We deliberately keep the api client out of the store so
 * cyclic imports don't break — the api module reads tokens via getState().
 */
export const useAuthStore = create()(
  persist(
    (set, get) => ({
      ...initial,

      setSession: ({ user, tokens }) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        }),

      setUser: (user) => set({ user }),

      logout: () => set({ ...initial, hydrated: true }),

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );
        set({
          user: data.user,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          accessTokenExpiresAt: data.tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: data.tokens.refreshTokenExpiresAt,
        });
        return data;
      },
    }),
    {
      name: 'excalidrow.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        accessTokenExpiresAt: s.accessTokenExpiresAt,
        refreshTokenExpiresAt: s.refreshTokenExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
