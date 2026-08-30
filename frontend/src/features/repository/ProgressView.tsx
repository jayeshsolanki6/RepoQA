import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react';
import type { ProgressEvent } from '@/types/api';

const STEPS = [
  ['cloning', 'Clone repository'],
  ['loading', 'Read repository files'],
  ['chunking', 'Create code chunks'],
  ['embedding', 'Generate embeddings'],
  ['saving', 'Save vectors'],
  ['completed', 'Ready to chat'],
] as const;

const STEP_INDEX = new Map<string, number>(STEPS.map(([step], index) => [step, index]));

export function ProgressView({ events }: { events: ProgressEvent[] }) {
  const failure = events.find((event) => event.step === 'failed');
  const isComplete = events.some((event) => event.step === 'completed');

  /*
   * Track the furthest step ever reached rather than reading the last event.
   * "failed" is not a pipeline step, so keying off the latest event used to
   * reset every row to pending and throw away how far indexing actually got.
   */
  const reached = events.reduce((furthest, event) => {
    const index = STEP_INDEX.get(event.step);
    return index !== undefined && index > furthest ? index : furthest;
  }, -1);

  const latestMessage = events[events.length - 1]?.message;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-5">
        <p className="code-font text-[10px] uppercase tracking-[0.18em] text-slate-600">
          index pipeline
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-white">
          {isComplete
            ? 'Repository indexed'
            : failure
              ? 'Indexing stopped'
              : 'Preparing your repository'}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {isComplete
            ? 'The semantic index is ready to query.'
            : failure
              ? 'The pipeline stopped before it finished. Details below.'
              : 'RepoQA is building the semantic index in the background.'}
        </p>
      </div>

      <div className="space-y-1" aria-live="polite">
        {STEPS.map(([step, label], index) => {
          const done = isComplete || index < reached;
          const errored = Boolean(failure) && index === reached;
          const active = !isComplete && !failure && index === reached;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                active
                  ? 'border-lime-300/15 bg-lime-300/[0.04]'
                  : errored
                    ? 'border-red-400/15 bg-red-400/[0.04]'
                    : 'border-transparent'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg">
                {done ? (
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-lime-300/15 bg-lime-300/[0.06] text-lime-300">
                    <Check size={15} />
                  </span>
                ) : errored ? (
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-red-400/20 bg-red-400/[0.06] text-red-400">
                    <AlertTriangle size={14} />
                  </span>
                ) : active ? (
                  <span className="grid h-7 w-7 place-items-center rounded-lg border border-lime-300/15 bg-lime-300/[0.06] text-lime-300">
                    <Loader2 size={15} className="animate-spin" />
                  </span>
                ) : (
                  <span className="text-slate-700">
                    <Circle size={14} />
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    errored ? 'text-red-200' : done || active ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {label}
                </p>
                {(active || errored) && latestMessage && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{latestMessage}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {failure && (
        <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3">
          <p className="flex items-start gap-2 text-sm text-red-200">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{failure.message || 'Indexing failed.'}</span>
          </p>
          <p className="mt-2 pl-[23px] text-xs leading-5 text-slate-500">
            The worker reports a single generic failure, so check the backend console for the
            underlying error.
          </p>
        </div>
      )}
    </div>
  );
}
