import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSchema } from './auth.schema';
import { useAuthStore } from './authStore';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

const LABEL = 'block text-xs uppercase tracking-[0.14em] text-slate-500';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.isSigningUp);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = RegisterSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }
    setError('');
    if (await register(form.name, form.email, form.password)) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <main className="grid flex-1 place-items-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <span className="code-font text-xs uppercase tracking-[0.18em] text-lime-300">
            auth / register
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Create your workspace.
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Add a repo and start asking grounded questions.
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

          <label htmlFor="register-name" className={LABEL}>
            Name
          </label>
          <Input
            id="register-name"
            className="mt-1.5"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            disabled={loading}
          />

          <label htmlFor="register-email" className={`mt-4 ${LABEL}`}>
            Email
          </label>
          <Input
            id="register-email"
            className="mt-1.5"
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />

          <label htmlFor="register-password" className={`mt-4 ${LABEL}`}>
            Password
          </label>
          <PasswordInput
            id="register-password"
            className="mt-1.5"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={loading}
          />

          <label htmlFor="register-confirm" className={`mt-4 ${LABEL}`}>
            Confirm password
          </label>
          <PasswordInput
            id="register-confirm"
            className="mt-1.5"
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="mt-5 w-full">
            Create account <ArrowRight size={16} />
          </Button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-lime-300 hover:text-lime-200">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
