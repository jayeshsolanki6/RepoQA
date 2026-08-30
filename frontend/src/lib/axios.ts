import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

/** Requests that must never trigger a refresh-and-retry cycle. */
const isAuthEndpoint = (url: string) => /\/auth\/(login|register|refresh)/.test(url);

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const url = originalRequest?.url ?? '';

    if (error.response?.status !== 401 || isAuthEndpoint(url) || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Delegated to the store so a 401 retry and the app's own session restore
    // share one in-flight request instead of racing to rotate the refresh token.
    const accessToken = await useAuthStore.getState().refresh();

    if (!accessToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    // The request interceptor re-applies the freshly stored access token.
    return api(originalRequest);
  },
);

export function getApiError(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
