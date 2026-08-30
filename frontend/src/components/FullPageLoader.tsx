import { GitBranch } from 'lucide-react';

/** Full-viewport loading state used while the session is being restored. */
export function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink px-6">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-11 w-11 animate-pulse place-items-center rounded-xl bg-accent text-black">
          <GitBranch size={22} />
        </span>
        <p className="code-font text-[10px] uppercase tracking-[0.22em] text-slate-600">
          restoring session
        </p>
      </div>
    </div>
  );
}
