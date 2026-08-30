import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/Spinner';
import { ErrorState } from '@/components/ErrorState';
import { ProgressView } from './ProgressView';
import { streamProgress } from './progress.api';
import { repositoryApi } from './repository.api';
import { getApiError } from '@/lib/axios';
import type { ProgressEvent, Repository } from '@/types/api';

export function IndexingPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [pageError, setPageError] = useState('');
  const [streamError, setStreamError] = useState('');

  useEffect(() => {
    if (!repositoryId) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const repo = await repositoryApi.getOne(repositoryId);
        setRepository(repo);
        await streamProgress(
          repositoryId,
          {
            /*
             * The backend replays stored history after subscribing to live
             * events, so a replayed event with a lower id can arrive after a
             * newer one. Sort by id on insert instead of trusting arrival order.
             */
            onEvent: (event) => {
              setEvents((previous) => {
                if (previous.some((item) => item.id === event.id)) return previous;
                return [...previous, event].sort((a, b) => a.id - b.id);
              });
            },
            onError: (error) => setStreamError(error.message),
          },
          controller.signal,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setPageError(getApiError(error, 'Could not load indexing progress.'));
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [repositoryId]);

  // Terminal state is a property of the whole stream, not of the last event.
  const { completed, failed } = useMemo(
    () => ({
      completed: events.some((event) => event.step === 'completed'),
      failed: events.some((event) => event.step === 'failed'),
    }),
    [events],
  );

  useEffect(() => {
    if (!completed || !repositoryId) return;
    const timer = window.setTimeout(
      () => navigate(`/repositories/${repositoryId}`, { replace: true }),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [completed, navigate, repositoryId]);

  if (!repositoryId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message="Missing repository id." />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-8">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex w-fit items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={15} /> Back to repositories
      </button>

      <div className="mb-5 mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="code-font text-[10px] uppercase tracking-[0.18em] text-lime-300">
            repository / indexing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {repository ? `${repository.owner}/${repository.name}` : 'Repository'}
          </h1>
          {repository && (
            <a
              href={repository.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-lime-300"
            >
              Open on GitHub <ExternalLink size={12} />
            </a>
          )}
        </div>
        {events.length === 0 && !pageError && <Spinner />}
      </div>

      {pageError ? (
        <ErrorState message={pageError} onRetry={() => window.location.reload()} />
      ) : (
        <ProgressView events={events} />
      )}

      {streamError && !completed && !failed && (
        <p className="mx-auto mt-3 max-w-xl text-center text-xs text-amber-300">{streamError}</p>
      )}

      {completed && (
        <div className="mx-auto mt-3 flex max-w-xl flex-col gap-3 rounded-xl border border-lime-300/10 bg-lime-300/[0.035] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-lime-200">
            <CheckCircle2 size={16} /> Repository ready.
          </span>
          <Button
            type="button"
            className="px-3 py-2 text-xs"
            onClick={() => navigate(`/repositories/${repositoryId}`)}
          >
            Open chat
          </Button>
        </div>
      )}

      {failed && (
        <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.03] px-4 py-3 text-xs text-slate-500">
          <span>Delete this repository from the dashboard and add it again to retry.</span>
          <Link to="/dashboard" className="text-lime-300 hover:text-lime-200">
            Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
