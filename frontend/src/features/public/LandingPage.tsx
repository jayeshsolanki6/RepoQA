import { useState } from 'react';
import { ArrowRight, Check, Github, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { repositoryApi } from '@/features/repository/repository.api';
import { useAuth } from '@/hooks/useAuth';
import { getApiError } from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const STEPS = [
  ['01', 'Paste a link', 'Connect a public GitHub repository in one step.'],
  ['02', 'RepoQA indexes it', 'Clone, load, chunk, embed and store code for semantic retrieval.'],
  ['03', 'Ask anything', 'Get grounded answers with exact source file and line ranges.'],
] as const;

const EXAMPLE_REPOS = ['expressjs/express', 'drizzle-team/drizzle-orm', 'facebook/react'];

export function LandingPage() {
  const navigate = useNavigate();
  /**
   * `isLoading` is true until the session restore settles. Branching on `user`
   * alone made the page flash the logged-out CTA ("Get started", the sign-in
   * note) for a second before switching to the logged-in one.
   */
  const { user, isLoading: isRestoring } = useAuth();
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!user) {
      navigate('/register');
      return;
    }
    const trimmed = githubUrl.trim();
    if (!trimmed) {
      toast.error('Enter a GitHub repository URL');
      return;
    }
    try {
      setLoading(true);
      const repository = await repositoryApi.create(trimmed);
      navigate(`/repositories/${repository.id}/indexing`);
    } catch (error) {
      toast.error(getApiError(error, 'Could not add repository'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1">
      {/*
        No `min-h-screen` here: the header already occupies 4rem inside the
        layout wrapper, so a full-viewport section made every page taller than
        the viewport and left a one-or-two-line scroll on otherwise short pages.
      */}
      <section className="grid-bg relative mx-auto max-w-[1400px] px-5 pb-14 pt-10 sm:px-8 sm:pt-14">
        <div className="max-w-4xl">
          <div className="code-font flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-lime-300">
            <span>//</span> drop a GitHub link, start a conversation
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl">
            Point it at a repo.
            <span className="block text-lime-300">Ask it anything.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            RepoQA indexes your codebase, retrieves relevant code for each question, and answers
            with file and line citations.
          </p>

          <div className="mt-6 max-w-5xl rounded-2xl border border-line bg-surface/95 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Github
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  size={18}
                />
                <Input
                  value={githubUrl}
                  onChange={(event) => setGithubUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void start();
                  }}
                  placeholder="https://github.com/owner/repo"
                  className="h-13 border-0 bg-transparent pl-11 pr-4 focus:ring-0"
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                loading={loading}
                onClick={() => void start()}
                className="h-13 rounded-xl px-6"
              >
                <Sparkles size={16} />
                {/*
                  While the session restores, a shimmer bar sized like the
                  eventual label keeps the button from reflowing when the
                  real text swaps in.
                */}
                {isRestoring ? (
                  <span className="skeleton h-3.5 w-24 rounded" />
                ) : user ? (
                  'Index & chat'
                ) : (
                  'Get started'
                )}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="mr-1 code-font text-[10px] uppercase tracking-[0.14em]">try</span>
            {EXAMPLE_REPOS.map((repo) => (
              <button
                key={repo}
                type="button"
                onClick={() => setGithubUrl(`https://github.com/${repo}`)}
                className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 code-font text-[10px] text-slate-500 transition hover:border-lime-300/15 hover:text-lime-300"
              >
                {repo}
              </button>
            ))}
          </div>

          {!isRestoring && !user && (
            <p className="animate-fade-in mt-3 text-xs text-slate-600">
              You will be asked to create a free account first —{' '}
              <Link to="/login" className="text-lime-300 hover:text-lime-200">
                or sign in
              </Link>
              .
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-5 border-t border-white/[0.08] pt-6 md:grid-cols-3">
          {STEPS.map(([number, title, text]) => (
            <div key={number} className="border-t border-white/[0.08] pt-4 md:border-t-0 md:pt-0">
              <p className="code-font text-xs text-lime-300">{number}</p>
              <h2 className="mt-2 text-sm font-semibold text-white">{title}</h2>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface/80 p-5">
            <div className="flex items-center gap-3">
              <Search size={17} className="text-lime-300" />
              <p className="code-font text-[10px] uppercase tracking-[0.17em] text-slate-500">
                retrieval first
              </p>
            </div>
            <p className="mt-3.5 text-lg font-semibold text-white">
              Find the code before generating the answer.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              RepoQA embeds your code and question, then retrieves the most relevant chunks from
              PostgreSQL + pgvector.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface/80 p-5">
            <div className="flex items-center gap-3">
              <Check size={17} className="text-lime-300" />
              <p className="code-font text-[10px] uppercase tracking-[0.17em] text-slate-500">
                grounded answers
              </p>
            </div>
            <p className="mt-3.5 text-lg font-semibold text-white">
              Every answer points back to the repository.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Relevant file paths and line ranges are returned with every answer so you can verify
              it.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-5 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Check size={15} className="text-lime-300" /> React + TypeScript
          </span>
          <span className="inline-flex items-center gap-2">
            <Check size={15} className="text-lime-300" /> Express + PostgreSQL
          </span>
          <span className="inline-flex items-center gap-2">
            <Check size={15} className="text-lime-300" /> Gemini + pgvector
          </span>
          {isRestoring ? (
            /*
             * Occupies the same right-aligned slot as the link it resolves
             * into, so the row's rhythm doesn't jump when the text lands.
             */
            <span className="skeleton ml-auto h-5 w-32 rounded-md" aria-busy="true" />
          ) : user ? (
            <Link
              to="/dashboard"
              className="animate-fade-in ml-auto inline-flex items-center gap-2 text-lime-300 hover:text-lime-200"
            >
              Go to dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="animate-fade-in ml-auto inline-flex items-center gap-2 text-lime-300 hover:text-lime-200"
            >
              Create account <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
