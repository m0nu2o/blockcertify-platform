
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white shadow-glow hover:bg-accent/90',
        secondary: 'border border-border/15 bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08]',
        ghost: 'text-foreground hover:bg-foreground/[0.08]',
        danger: 'bg-danger/90 text-white hover:bg-danger',
        outline: 'border border-border/25 bg-transparent text-foreground hover:bg-foreground/[0.06]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp suppressHydrationWarning className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
