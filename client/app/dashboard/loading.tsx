"use client";

import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-12 text-foreground">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-14 rounded-full border-2 border-accent/20 animate-ping" />
        <div className="size-10 rounded-full border-2 border-accent/40 bg-card/80 backdrop-blur-xl flex items-center justify-center shadow-glow">
          <Loader2 className="size-5 text-accent animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-foreground/50 animate-pulse tracking-wide">
        Preparing workspace...
      </p>
    </div>
  );
}
