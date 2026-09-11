
import { cn } from '@/lib/utils';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full border border-border/15 bg-foreground/[0.04] px-3 py-1 text-xs font-semibold text-foreground/80 backdrop-blur-xl', className)}>{children}</span>;
}
