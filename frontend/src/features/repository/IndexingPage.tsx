import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
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
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white"
        >
          <ArrowLeft size={14} /> Repositories
        </button>
        {repository && (
          <a
            href={repository.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-lime-300"
          >
            {repository.owner}/{repository.name} <ExternalLink size={11} />
          </a>
        )}
      </div>

      {pageError ? (
        <ErrorState message={pageError} onRetry={() => window.location.reload()} />
      ) : (
        <ProgressView events={events} />
      )}

      {streamError && !completed && !failed && (
        <p className="mt-2.5 text-center text-xs text-amber-300">{streamError}</p>
      )}

      {completed && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-lime-300/15 bg-lime-300/[0.04] px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-lime-200">
            <CheckCircle2 size={15} /> Repository ready.
          </span>
          <Button
            type="button"
            className="h-8 px-3.5 text-xs"
            onClick={() => navigate(`/repositories/${repositoryId}`)}
          >
            Open chat
          </Button>
        </div>
      )}

      {failed && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-2.5 text-xs text-slate-400">
          <span>Indexing failed. Remove and retry.</span>
          <Link to="/dashboard" className="font-medium text-lime-300 hover:text-lime-200">
            Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
