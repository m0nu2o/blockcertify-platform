
"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

export function FAQList({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q} className="rounded-xl border border-border/20 bg-card/60 hover:border-accent/30 hover:bg-card/80 transition-all duration-200 overflow-hidden">
            <button suppressHydrationWarning className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setOpenIndex(open ? null : index)}>
              <span className="text-base font-semibold text-foreground">{item.q}</span>
              <ChevronDown className={`size-5 shrink-0 text-foreground/60 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} />
            </button>
            {open && <div className="px-4 sm:px-5 pb-5 text-sm leading-relaxed text-foreground/75 max-w-2xl border-t border-border/10 pt-3 mt-1">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
