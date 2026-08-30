import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-accent/45 focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
});

Textarea.displayName = 'Textarea';
