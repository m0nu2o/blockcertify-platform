"use client";

import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 rounded-full border-2 border-accent/20 animate-ping" />
        <div className="size-12 rounded-full border-2 border-accent/40 bg-card/80 backdrop-blur-xl flex items-center justify-center shadow-glow">
          <Loader2 className="size-6 text-accent animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-foreground/60 animate-pulse tracking-wide">
        Loading BlockCertify...
      </p>
    </div>
  );
}
