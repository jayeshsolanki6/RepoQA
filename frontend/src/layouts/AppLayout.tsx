import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';

export function AppLayout() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/repositories/') && !location.pathname.endsWith('/indexing');

  return (
    <div className="min-h-dvh bg-ink text-[#eaf0ee]">
      {!isChat && <AppHeader />}
      <Outlet />
    </div>
  );
}
