import { ExternalLink, LogOut, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/features/auth/authStore';
import { useActiveRepoStore } from '@/features/repository/activeRepoStore';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isRestoring = useAuthStore((state) => state.isLoading);
  const activeRepo = useActiveRepoStore((state) => state.activeRepo);

  const isRepoRoute = location.pathname.startsWith('/repositories/');
  const onLogin = location.pathname === '/login';
  const onRegister = location.pathname === '/register';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 border-b border-white/[0.07] bg-ink/95 backdrop-blur-md">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          {user && isRepoRoute && (
            <>
              <span className="hidden text-slate-700 sm:inline">/</span>
              <Link
                to="/dashboard"
                className="hidden text-xs font-medium text-slate-400 transition hover:text-white sm:inline"
                title="Back to Repositories"
              >
                Repositories
              </Link>
              {activeRepo && (
                <>
                  <span className="text-slate-700">/</span>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-white">
                      {activeRepo.owner}/{activeRepo.name}
                    </span>
                    <a
                      href={activeRepo.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-white/[0.06] hover:text-lime-300"
                      title="Open in GitHub"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {isRestoring ? (
          <div className="flex items-center gap-2" aria-busy="true" aria-label="Restoring session">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton hidden h-8 w-24 rounded-lg sm:block" />
          </div>
        ) : user ? (
          <div className="animate-fade-in flex items-center gap-2 shrink-0">
            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-400 sm:flex">
              <UserRound size={13} />
              <span className="max-w-[140px] truncate">{user.name}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <nav className="animate-fade-in flex items-center gap-1.5">
            {!onLogin && (
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Sign in
              </Link>
            )}
            {!onRegister && (
              <Link
                to="/register"
                className="rounded-lg bg-lime-300 px-3.5 py-1.5 text-xs font-medium text-black transition hover:bg-lime-200"
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
