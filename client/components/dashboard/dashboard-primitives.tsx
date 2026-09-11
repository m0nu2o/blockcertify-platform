"use client";

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Inbox } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';

export function DashboardMetricCard({
  label,
  value,
  caption,
  badge,
}: {
  label: string;
  value: number | string;
  caption: string;
  badge?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
      <GlassCard className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow cursor-default h-full flex flex-col justify-between">
        <div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100 group-hover:via-accent/80" />
          <div className="min-w-0 flex-1">
            <div className="h-6 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">{label}</span>
              {badge ? <Badge className="border-accent/40 bg-accent/15 text-accent shadow-sm text-[10px] py-0.5 px-2 shrink-0">{badge}</Badge> : null}
            </div>
            <div className="mt-3 text-[2.5rem] font-bold tracking-tighter text-foreground truncate leading-none">
              {typeof value === 'number' ? formatNumber(value) : value}
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm font-medium text-foreground/60 leading-relaxed">{caption}</div>
      </GlassCard>
    </motion.div>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
      <GlassCard className="h-full flex flex-col">
        <div className="flex flex-col gap-3 border-b border-border/10 pb-4 md:flex-row md:items-start md:justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-foreground/60">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <div className="mt-5 flex-1">{children}</div>
      </GlassCard>
    </motion.div>
  );
}

export function DashboardStateCard({
  title,
  description,
  action,
  variant = 'empty',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'loading' | 'error' | 'empty';
}) {
  if (variant === 'loading') {
    return (
      <GlassCard>
        <div className="flex flex-col gap-4 p-6 w-full animate-pulse min-h-[280px]">
          <div className="flex justify-between items-center w-full mb-2">
            <div className="h-7 w-40 bg-foreground/[0.05] rounded-full" />
            <div className="h-9 w-28 bg-foreground/[0.05] rounded-full" />
          </div>
          <div className="space-y-3 mt-4 w-full">
            <div className="h-20 w-full bg-foreground/[0.03] rounded-[1.5rem]" />
            <div className="h-20 w-full bg-foreground/[0.03] rounded-[1.5rem]" />
            <div className="h-20 w-full bg-foreground/[0.03] rounded-[1.5rem]" />
          </div>
        </div>
      </GlassCard>
    );
  }

  const icon = variant === 'error' ? <AlertTriangle className="size-5" /> : <Inbox className="size-5" />;
  const iconClassName = variant === 'error' ? 'bg-danger/15 text-danger border-danger/20' : 'bg-foreground/[0.06] text-foreground/70 border-border/10';

  return (
    <GlassCard>
      <div className="relative overflow-hidden flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-border/10 bg-card/40 p-10 text-center min-h-[280px]">
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[50px] pointer-events-none", variant === 'error' ? 'bg-danger/5' : 'bg-foreground/[0.03]')} />
        <div className={cn('relative z-10 grid size-14 place-items-center rounded-[1.25rem] shadow-glow border', iconClassName, variant === 'error' ? 'border-danger/20' : 'border-border/10')}>{icon}</div>
        <div className="relative z-10">
          <div className="text-lg font-bold tracking-tight text-foreground">{title}</div>
          <p className="mt-2 max-w-sm text-sm text-foreground/60 leading-relaxed">{description}</p>
        </div>
        {action ? <div className="relative z-10 mt-2">{action}</div> : null}
      </div>
    </GlassCard>
  );
}

export function EmptyListState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/10 bg-card/40 p-10 text-center flex flex-col items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/5 rounded-full blur-[50px] pointer-events-none" />
      <div className="relative z-10 grid size-14 place-items-center rounded-[1.25rem] bg-accent/10 border border-accent/20 text-accent mb-5 shadow-glow">
        <Inbox className="size-5" />
      </div>
      <div className="relative z-10 font-bold text-lg text-foreground tracking-tight">{title}</div>
      <div className="relative z-10 mt-2 text-sm leading-relaxed text-foreground/60 max-w-sm">{description}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'border-success/30 bg-success/10 text-success',
    issued: 'border-accent/30 bg-accent/10 text-accent',
    revoked: 'border-danger/30 bg-danger/10 text-danger',
    expired: 'border-warning/30 bg-warning/10 text-warning',
    read: 'border-border/10 bg-foreground/[0.05] text-foreground/70',
    unread: 'border-accent/30 bg-accent/10 text-accent',
    approved: 'border-success/30 bg-success/10 text-success',
    pending: 'border-warning/30 bg-warning/10 text-warning',
    suspended: 'border-danger/30 bg-danger/10 text-danger',
    rejected: 'border-danger/30 bg-danger/10 text-danger',
  };

  return <Badge className={cn('capitalize', styles[status] || 'border-border/10 bg-foreground/[0.05] text-foreground/75')}>{status}</Badge>;
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return <Button onClick={onClick}>Retry</Button>;
}
