import { useAuthStore } from '@/features/auth/authStore';

/**
 * Read-only view of the session. The initial restore is kicked off once in
 * `App`, so this hook must not trigger side effects of its own — doing that
 * inside route guards is what previously left the public landing page with no
 * session at all.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  };
}
