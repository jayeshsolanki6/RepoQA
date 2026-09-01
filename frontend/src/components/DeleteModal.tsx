import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteModalProps {
  title: string;
  /** Confirmation body. May include styled spans for emphasised names. */
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}: DeleteModalProps) {
  // Close on Escape.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel, loading]);

  // Prevent body scroll while the dialog is open.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="animate-overlay-in absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div className="animate-panel-in relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-5 sm:p-7">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-red-400/20 bg-red-400/[0.06]">
            <AlertTriangle size={21} className="text-red-400" />
          </div>

          <h2 id="delete-modal-title" className="text-lg font-semibold tracking-tight text-white">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              loading={loading}
              className="px-4 py-2.5 text-sm"
            >
              {!loading && <Trash2 size={14} />}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
