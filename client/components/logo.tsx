import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 text-accent", className)}>
      <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-glow">
        <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="url(#grad1)" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M20 8L30 14V26L20 32L10 26V14L20 8Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
        <path d="M20 14L25 17V23L20 26L15 23V17L20 14Z" fill="currentColor"/>
        <defs>
          <linearGradient id="grad1" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
