import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '@/components/FullPageLoader';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
