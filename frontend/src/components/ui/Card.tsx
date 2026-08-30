import type { PropsWithChildren } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl border border-line bg-surface/90 ${className}`}>{children}</div>
  );
}
