import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-[#eaf0ee]">
      <AppHeader />
      <Outlet />
    </div>
  );
}
