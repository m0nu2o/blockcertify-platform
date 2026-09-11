"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Dashboard Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-foreground">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card/90 p-8 backdrop-blur-2xl shadow-glass text-center space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="text-lg font-bold">Workspace Error</h3>
        <p className="text-xs text-foreground/60 leading-relaxed">
          {error?.message || 'Unable to load workspace data. Please retry or check backend services.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button size="sm" onClick={() => reset()} className="gap-2">
            <RefreshCw className="size-3.5" /> Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
