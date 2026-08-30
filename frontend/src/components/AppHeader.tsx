import { LogOut, LayoutDashboard, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/features/auth/authStore';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isDashboard = location.pathname === '/dashboard';
  const onLogin = location.pathname === '/login';
  const onRegister = location.pathname === '/register';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-5 sm:px-8">
        <Logo />

        {user ? (
          <div className="flex items-center gap-2">
            {!isDashboard && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
                title="Go to Dashboard"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-slate-400 sm:flex">
              <UserRound size={14} />
              <span className="max-w-[140px] truncate">{user.name}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          /*
           * The public header used to render an empty <div/>, which is why the
           * landing page had no way into the app. Links are contextual so the
           * auth pages don't advertise the page you are already on.
           */
          <nav className="flex items-center gap-1.5">
            {!onLogin && (
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Sign in
              </Link>
            )}
            {!onRegister && (
              <Link
                to="/register"
                className="rounded-lg bg-lime-300 px-3.5 py-2 text-xs font-medium text-black transition hover:bg-lime-200"
              >
                Create account
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
