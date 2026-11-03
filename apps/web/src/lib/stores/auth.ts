import { writable } from 'svelte/store';
import type { User } from '../types/api';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: false,
    error: null
  });

  return {
    subscribe,

    async login(email: string, password: string) {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const user = await authApi.login({ email, password });
        set({ user, loading: false, error: null });
        return user;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Login failed';
        set({ user: null, loading: false, error });
        throw err;
      }
    },

    async checkSession() {
      update(state => ({ ...state, loading: true }));
      try {
        const user = await authApi.getSession();
        set({ user, loading: false, error: null });
        return user;
      } catch (err) {
        set({ user: null, loading: false, error: null });
        return null;
      }
    },

    async logout() {
      update(state => ({ ...state, loading: true }));
      try {
        await authApi.logout();
        set({ user: null, loading: false, error: null });
      } catch (err) {
        set({ user: null, loading: false, error: null });
      }
    },

    clear() {
      set({ user: null, loading: false, error: null });
    }
  };
}

export const authStore = createAuthStore();
