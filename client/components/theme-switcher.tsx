"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Paintbrush2, X } from 'lucide-react';
import { useThemeManager } from '@/contexts/theme-provider';
import { themes } from '@/lib/themes';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({
  align = 'end',
  direction = 'down',
  showLabel = true,
  isCollapsed = false,
  fullWidth = false,
}: {
  align?: 'start' | 'end' | 'center';
  direction?: 'up' | 'down';
  showLabel?: boolean;
  isCollapsed?: boolean;
  fullWidth?: boolean;
}) {
  const { theme, setTheme } = useThemeManager();
  const [open, setOpen] = useState(false);
  const activeTheme = themes.find((item) => item.name === theme);

  return (
    <div className={cn("relative", fullWidth ? "w-full flex flex-col-reverse" : "inline-block")}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Change theme"
        className={cn(
          "flex items-center text-foreground transition hover:bg-foreground/[0.08] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isCollapsed ? "justify-center size-12 rounded-full mx-auto" : showLabel ? "gap-2 rounded-xl border border-border/15 bg-foreground/[0.04] px-4 py-2 text-sm font-medium" : "justify-center size-10 rounded-full border border-border/15 bg-foreground/[0.04]",
          fullWidth && !isCollapsed && "w-full justify-between"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Paintbrush2 className="size-4 text-accent shrink-0" />
          {showLabel && !isCollapsed && <span className="hidden sm:inline whitespace-nowrap truncate">{activeTheme?.label ?? 'Theme'}</span>}
        </div>
        <span className={cn("rounded-full shrink-0", isCollapsed ? "size-3 absolute bottom-2 right-2 border-[1.5px] border-card" : "size-2.5")} style={{ background: activeTheme?.accent }} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: isCollapsed ? 0 : 'auto', scale: isCollapsed ? 1 : 0.95, y: isCollapsed ? 0 : (direction === 'up' ? 10 : -10) }}
            animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
            exit={{ opacity: 0, height: isCollapsed ? 0 : 'auto', scale: isCollapsed ? 1 : 0.95, y: isCollapsed ? 0 : (direction === 'up' ? 10 : -10) }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "z-50",
              isCollapsed 
                ? "w-full overflow-hidden mb-2" 
                : cn("absolute min-w-[240px]", direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3', align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2')
            )}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-2 max-h-[200px] overflow-y-auto scrollbar-hide rounded-[24px] border border-white/5 bg-foreground/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" data-lenis-prevent="true">
                {themes.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setTheme(item.name)}
                    className={cn(
                      'flex items-center justify-center rounded-full transition-all duration-300 size-8 shrink-0',
                      theme === item.name
                        ? 'border border-accent/50 bg-accent/15 shadow-glow ring-1 ring-accent/20'
                        : 'border border-border/10 hover:border-border/20 hover:bg-foreground/[0.06]'
                    )}
                  >
                    <span 
                      className="rounded-full shadow-md shrink-0 size-4" 
                      style={{ 
                        background: item.accent,
                        boxShadow: theme === item.name ? `0 0 15px ${item.accent}` : undefined
                      }} 
                    />
                  </button>
                ))}
              </div>
            ) : (
              <GlassCard className="p-3 shadow-2xl border-accent/20 bg-card/95 backdrop-blur-3xl rounded-3xl w-[260px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Select Theme</span>
                  <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1 text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-colors ml-auto -mt-1 -mr-1">
                    <X className="size-4" />
                  </button>
                </div>
                
                <div
                  className="grid grid-cols-2 max-h-[260px] overflow-y-auto scrollbar-hide pr-1 gap-2"
                  data-lenis-prevent="true"
                >
                  {themes.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setTheme(item.name)}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border text-center transition-all duration-300 p-3 gap-2',
                        theme === item.name
                          ? 'border-accent/50 bg-accent/15 text-foreground shadow-glow ring-1 ring-accent/20'
                          : 'border-border/10 bg-foreground/[0.02] text-foreground/60 hover:border-border/20 hover:bg-foreground/[0.06] hover:text-foreground'
                      )}
                    >
                      <span 
                        className="rounded-full shadow-md shrink-0 size-5" 
                        style={{ 
                          background: item.accent,
                          boxShadow: theme === item.name ? `0 0 15px ${item.accent}` : undefined
                        }} 
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
