import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-ink text-[#eaf0ee]">
      <AppHeader />
      <Outlet />
    </div>
  );
}
