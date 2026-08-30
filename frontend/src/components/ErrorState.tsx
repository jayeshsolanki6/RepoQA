import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-red-300" size={18} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-200">{message}</p>
          {onRetry && <Button variant="secondary" className="mt-4 px-3 py-2 text-xs" onClick={onRetry}>Try again</Button>}
        </div>
      </div>
    </div>
  );
}
