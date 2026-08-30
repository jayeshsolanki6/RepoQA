import { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren } from 'react';
import { Spinner } from '@/components/Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

const VARIANTS = {
  primary: 'bg-accent text-black hover:bg-lime-200 active:bg-lime-300/90',
  secondary: 'border border-line bg-white/[0.035] text-white hover:bg-white/[0.07]',
  danger: 'border border-red-400/20 bg-red-400/[0.05] text-red-300 hover:bg-red-400/[0.1]',
} as const;

export const Button = forwardRef<HTMLButtonElement, PropsWithChildren<ButtonProps>>(
  ({ children, loading = false, variant = 'primary', disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
