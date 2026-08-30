import { Navigate, Outlet } from 'react-router-dom';
import { FullPageLoader } from '@/components/FullPageLoader';
import { useAuth } from '@/hooks/useAuth';

export function GuestRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
