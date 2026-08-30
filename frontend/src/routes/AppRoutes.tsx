import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { LandingPage } from '@/features/public/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/repository/DashboardPage';
import { IndexingPage } from '@/features/repository/IndexingPage';
import { ChatPage } from '@/features/chat/ChatPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repositories/:repositoryId/indexing" element={<IndexingPage />} />
          <Route path="/repositories/:repositoryId" element={<ChatPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
