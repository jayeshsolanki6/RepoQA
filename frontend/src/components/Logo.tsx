import { GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';

export function Logo() {
  const user = useAuthStore((state) => state.user);

  return (
    <Link to={user ? '/dashboard' : '/'} className="group flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_28px_rgba(190,255,60,0.12)] transition group-hover:rotate-3">
        <GitBranch size={21} />
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-tight text-white">RepoQA</span>
        <span className="mt-1 block code-font text-[9px] uppercase tracking-[0.25em] text-slate-500">
          chat with code
        </span>
      </span>
    </Link>
  );
}
