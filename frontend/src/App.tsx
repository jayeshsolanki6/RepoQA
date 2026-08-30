import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAuthStore } from '@/features/auth/authStore';

export default function App() {
  // Restore the session once for the whole app. Route guards only read the
  // result, so public pages know about a logged-in user too. `refresh()`
  // de-duplicates internally, which keeps StrictMode's double mount safe.
  useEffect(() => {
    void useAuthStore.getState().refresh();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
      {/* Match the app surface instead of sonner's stock dark palette. */}
      <Toaster
        theme="dark"
        position="bottom-right"
        closeButton
        gap={10}
        toastOptions={{
          classNames: {
            toast:
              'rounded-xl border border-line bg-surface text-sm text-slate-200 shadow-[0_18px_50px_rgba(0,0,0,0.55)]',
            title: 'font-medium',
            description: 'text-slate-500',
            actionButton: 'rounded-lg bg-accent text-black',
            closeButton: 'border-line bg-surface text-slate-400',
            error: 'border-red-400/25 text-red-200',
            success: 'border-accent/25 text-lime-100',
          },
        }}
      />
    </BrowserRouter>
  );
}
