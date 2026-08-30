import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/[0.16] focus:border-accent/45 focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
    );
  },
);

Input.displayName = 'Input';
