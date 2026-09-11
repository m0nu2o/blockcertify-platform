"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App Router Uncaught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card/90 p-8 backdrop-blur-2xl shadow-glass text-center space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {error?.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="size-4" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
