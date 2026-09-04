import { useEffect, useState, type FormEvent } from 'react';
import { Github, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { DeleteModal } from '@/components/DeleteModal';
import { RepositoryCard } from './RepositoryCard';
import { RepositoryListSkeleton } from './RepositoryListSkeleton';
import { repositoryApi } from './repository.api';
import { getApiError } from '@/lib/axios';
import type { Repository } from '@/types/api';

export function DashboardPage() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteRepo, setConfirmDeleteRepo] = useState<Repository | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setLoadingError('');
      const data = await repositoryApi.getAll();
      setRepositories(data);
    } catch (error) {
      setLoadingError(getApiError(error, 'Could not load your repositories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addRepository = async (event: FormEvent) => {
    event.preventDefault();
    let url = githubUrl.trim();
    if (!url) {
      toast.error('Enter a GitHub repository URL or owner/repo');
      return;
    }

    // Smart URL normalization: support "owner/repo" or "github.com/owner/repo"
    if (!/^https?:\/\//i.test(url)) {
      if (url.startsWith('github.com/')) {
        url = `https://${url}`;
      } else if (/^[\w.-]+\/[\w.-]+$/.test(url)) {
        url = `https://github.com/${url}`;
      }
    }

    try {
      setAdding(true);
      const repository = await repositoryApi.create(url);
      setGithubUrl('');
      toast.success('Repository connected');
      navigate(`/repositories/${repository.id}/indexing`);
    } catch (error) {
      toast.error(getApiError(error, 'Could not add repository'));
    } finally {
      setAdding(false);
    }
  };

  const requestDelete = (id: string) => {
    const repo = repositories.find((r) => r.id === id) ?? null;
    setConfirmDeleteRepo(repo);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteRepo) return;
    const id = confirmDeleteRepo.id;
    try {
      setDeletingId(id);
      await repositoryApi.delete(id);
      setRepositories((items) => items.filter((item) => item.id !== id));
      toast.success('Repository deleted');
      setConfirmDeleteRepo(null);
    } catch (error) {
      toast.error(getApiError(error, 'Could not delete repository'));
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    if (deletingId) return; // don't allow cancel mid-delete
    setConfirmDeleteRepo(null);
  };

  return (
    <>
      {/* Delete confirmation modal */}
      {confirmDeleteRepo && (
        <DeleteModal
          title="Delete repository?"
          message={
            <>
              This permanently deletes{' '}
              <span className="code-font font-semibold text-white">
                {confirmDeleteRepo.owner}/{confirmDeleteRepo.name}
              </span>{' '}
              along with its indexed embeddings, conversations, and messages.
              <span className="mt-1 block text-slate-500">This action cannot be undone.</span>
            </>
          }
          confirmLabel="Delete repository"
          loading={Boolean(deletingId)}
          onConfirm={() => void confirmDelete()}
          onCancel={cancelDelete}
        />
      )}

      <main className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="code-font text-[10px] uppercase tracking-[0.18em] text-lime-300">
              workspace / repositories
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Your codebases.
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Connect a public GitHub repository and RepoQA will index it in the background.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>

        <form onSubmit={addRepository} className="mt-5 rounded-2xl border border-line bg-surface p-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repository or owner/repo"
                className="h-12 border-0 bg-transparent pl-11 focus:ring-0"
                disabled={adding}
              />
            </div>
            <Button type="submit" loading={adding} className="h-12 px-5">
              <Plus size={16} /> Add repository
            </Button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="code-font text-[10px] uppercase tracking-[0.18em] text-slate-600">
              connected repositories
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {repositories.length === 1 ? '1 repository' : `${repositories.length} repositories`}
            </p>
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <RepositoryListSkeleton />
          ) : loadingError ? (
            <ErrorState message={loadingError} onRetry={() => void load()} />
          ) : repositories.length === 0 ? (
            <EmptyState
              title="No repositories yet"
              description="Paste a public GitHub URL above. Once indexing completes, you can start chatting with the codebase."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {repositories.map((repository) => (
                <RepositoryCard
                  key={repository.id}
                  repository={repository}
                  deleting={deletingId === repository.id}
                  onDelete={requestDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
