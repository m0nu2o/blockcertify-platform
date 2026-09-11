"use client";

import { ArrowUpRight } from 'lucide-react';

export function MetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-border/10 bg-card p-8 transition-all duration-500 hover:border-accent/30 hover:-translate-y-1 hover:shadow-2xl">
      {/* Background glow orb that follows the top right */}
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-accent/10 blur-[30px] transition-all duration-500 group-hover:bg-accent/30 group-hover:scale-150" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-bold">{label}</div>
          <ArrowUpRight className="size-4 text-accent opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
        </div>
        <div className="mt-5 text-5xl font-bold tracking-tighter text-foreground bg-clip-text">
          {value}
        </div>
        <p className="mt-4 text-sm text-foreground/50 leading-relaxed font-medium">{caption}</p>
      </div>
    </div>
  );
}
