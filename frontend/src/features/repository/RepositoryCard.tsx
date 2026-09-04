import { FileCode2, Github, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { Repository } from '@/types/api';

interface Props {
  repository: Repository;
  deleting: boolean;
  onDelete: (id: string) => void;
}

const formatAdded = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export function RepositoryCard({ repository, deleting, onDelete }: Props) {
  const navigate = useNavigate();
  const added = formatAdded(repository.createdAt);

  const handleCardClick = () => {
    navigate(`/repositories/${repository.id}`);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
      className="group cursor-pointer overflow-hidden p-4 transition-all duration-200 hover:border-lime-300/25 hover:bg-surface-2 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-lime-300/10 bg-lime-300/[0.06] text-lime-300 transition-colors group-hover:border-lime-300/25 group-hover:bg-lime-300/10">
              <Github size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-lime-300">
                {repository.owner}/{repository.name}
              </p>
              <a
                href={repository.githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 block truncate code-font text-[10px] text-slate-500 hover:text-lime-300 transition-colors"
              >
                {repository.githubUrl}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="flex min-w-0 items-center gap-2 code-font text-[10px] uppercase tracking-[0.14em] text-slate-600">
          <FileCode2 size={13} className="shrink-0" />
          <span className="truncate">{added ? `added ${added}` : 'repository'}</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(repository.id);
          }}
          disabled={deleting}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-400/[0.04] text-red-400 transition hover:border-red-400/40 hover:bg-red-400/[0.09] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          title="Delete repository"
          aria-label="Delete repository"
        >
          {deleting ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </Card>
  );
}
