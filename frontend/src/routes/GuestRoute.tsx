import { Navigate, Outlet } from 'react-router-dom';
import { FullPageLoader } from '@/components/FullPageLoader';
import { useAuthStore } from '@/features/auth/authStore';

export function GuestRoute() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = Boolean(useAuthStore((state) => state.user));

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
