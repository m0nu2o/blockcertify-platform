import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-32 w-full rounded-2xl border border-border/15 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/55 backdrop-blur-xl outline-none transition focus:border-accent/60 focus:bg-foreground/[0.05] focus:ring-2 focus:ring-accent/20',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
