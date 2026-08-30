import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoginSchema } from './auth.schema';
import { useAuthStore } from './authStore';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.isLoggingIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }
    setError('');
    if (await login(email, password)) navigate(from, { replace: true });
  };

  return (
    <main className="grid flex-1 place-items-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <span className="code-font text-xs uppercase tracking-[0.18em] text-lime-300">
            auth / login
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Welcome back.
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in and continue exploring your repositories.
          </p>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="rounded-2xl border border-line bg-surface p-5 sm:p-7"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 py-2.5 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <label
            htmlFor="login-email"
            className="block text-xs uppercase tracking-[0.14em] text-slate-500"
          >
            Email
          </label>
          <Input
            id="login-email"
            className="mt-1.5"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />

          <label
            htmlFor="login-password"
            className="mt-4 block text-xs uppercase tracking-[0.14em] text-slate-500"
          >
            Password
          </label>
          <PasswordInput
            id="login-password"
            className="mt-1.5"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="mt-5 w-full">
            Sign in <ArrowRight size={16} />
          </Button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-lime-300 hover:text-lime-200">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
