import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-[#eaf0ee]">
      <AppHeader />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
