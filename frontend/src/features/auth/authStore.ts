import { create } from 'zustand';
import { toast } from 'sonner';
import type { User } from '@/types/api';
import { getApiError } from '@/lib/axios';
import { authApi } from './auth.api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** True until the initial session restore has settled. */
  isLoading: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  setAuth: (user: User | null, accessToken: string | null) => void;
  clearAuth: () => void;
  /** Restores the session from the refresh cookie. Resolves to the new access token. */
  refresh: () => Promise<string | null>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * Shared across every caller of `refresh()`.
 *
 * The backend rotates the refresh token on each call and stores a single hash
 * per user, so two concurrent refreshes leave the stored hash and the browser
 * cookie out of sync — which logs the user out on the next reload. This promise
 * guarantees only one request is ever in flight.
 */
let refreshInFlight: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isLoggingIn: false,
  isSigningUp: false,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  clearAuth: () => set({ user: null, accessToken: null }),

  refresh: () => {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const data = await authApi.refresh();
        set({ user: data.user, accessToken: data.accessToken });
        return data.accessToken;
      } catch {
        // No valid session — stay logged out. This is the expected path for
        // first-time visitors, so it must not surface an error to the user.
        set({ user: null, accessToken: null });
        return null;
      } finally {
        set({ isLoading: false });
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  login: async (email, password) => {
    set({ isLoggingIn: true });
    try {
      const data = await authApi.login({ email, password });
      set({ user: data.user, accessToken: data.accessToken });
      toast.success('Login successful');
      return true;
    } catch (error) {
      toast.error(getApiError(error, 'Login failed'));
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  register: async (name, email, password) => {
    set({ isSigningUp: true });
    try {
      const data = await authApi.register({ name, email, password });
      set({ user: data.user, accessToken: data.accessToken });
      toast.success('Account created');
      return true;
    } catch (error) {
      toast.error(getApiError(error, 'Registration failed'));
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear the local session even when the server request fails.
    } finally {
      set({ user: null, accessToken: null });
      toast.success('Logged out');
    }
  },
}));
