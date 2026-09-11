import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    suppressHydrationWarning
    className={cn(
      'flex h-12 w-full rounded-2xl border border-border/15 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/45 backdrop-blur-xl outline-none transition-all duration-200 hover:border-border/30 hover:bg-foreground/[0.04] focus:border-accent/60 focus:bg-foreground/[0.05] focus:ring-4 focus:ring-accent/15 focus:shadow-[0_0_15px_rgba(var(--accent),0.1)]',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
