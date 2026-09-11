import { cn } from '@/lib/utils';

export function GlassCard({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-border/5 bg-foreground/[0.02] p-6 shadow-glass backdrop-blur-3xl ring-1 ring-inset ring-foreground/[0.02] transition-all duration-300',
        isClickable && 'cursor-pointer hover:-translate-y-1 hover:bg-foreground/[0.03] hover:shadow-2xl hover:border-accent/20',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent transition-opacity duration-300 group-hover:via-accent/40" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
