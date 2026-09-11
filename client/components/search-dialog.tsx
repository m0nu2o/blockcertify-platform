"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, ShieldCheck, CreditCard, BookOpen, X, Command, FileBadge2, UploadCloud, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actions = [
  { id: 'dashboard', title: 'Dashboard', category: 'Navigation', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'verify', title: 'Verify a Credential', category: 'Navigation', icon: ShieldCheck, href: '/verify' },
  { id: 'pricing', title: 'Pricing & Plans', category: 'Navigation', icon: CreditCard, href: '/pricing' },
  { id: 'docs', title: 'Documentation', category: 'Navigation', icon: BookOpen, href: '/documentation' },
  { id: 'issue', title: 'Issue Certificate', category: 'Actions', icon: FileBadge2, href: '/dashboard/institution' },
  { id: 'bulk', title: 'Bulk Upload CSV', category: 'Actions', icon: UploadCloud, href: '/dashboard/institution' },
  { id: 'settings', title: 'Profile Settings', category: 'Account', icon: Settings, href: '/dashboard/profile' },
  { id: 'logout', title: 'Sign Out', category: 'Account', icon: LogOut, action: 'logout' },
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
        return;
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const filtered = actions.filter((action) =>
    action.title.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, typeof actions>);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-hidden px-4 pt-[10vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 bg-background/80 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
            className="relative z-10 w-full max-w-[540px]"
          >
            <GlassCard className="flex flex-col overflow-hidden p-0 shadow-2xl border-accent/20 bg-card/95 rounded-[1.5rem]">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-border/10 bg-gradient-to-r from-accent/[0.06] to-transparent">
                <Search className="size-5 text-accent shrink-0" />
                <input
                  autoFocus
                  placeholder="Type to search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-lg font-medium outline-none placeholder:text-foreground/30 placeholder:italic placeholder:font-light pr-4"
                />
                <kbd className="hidden shrink-0 rounded-md border border-border/20 bg-foreground/5 px-2 py-1 font-mono text-[10px] font-bold text-foreground/50 sm:inline-block shadow-sm">ESC</kbd>
              </div>

              <div 
                className="min-h-[100px] max-h-[50vh] overflow-y-auto scrollbar-hide overscroll-contain px-4 py-4"
                data-lenis-prevent="true"
              >
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5 mb-3">
                      <Search className="size-6 text-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-foreground/60">No results found for &quot;{query}&quot;</p>
                    <p className="text-xs text-foreground/40 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-2 mb-2 text-[10px] font-extrabold text-foreground/40 uppercase tracking-widest">
                          {category}
                        </div>
                        <div className="grid gap-1">
                          {items.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                if (action.action === 'logout') {
                                  signOut({ callbackUrl: '/' });
                                } else if (action.href) {
                                  router.push(action.href);
                                }
                                onOpenChange(false);
                              }}
                              className={cn(
                                "group flex w-full items-center gap-4 rounded-2xl border border-transparent px-3 py-3 text-left text-sm transition-all duration-200",
                                action.action === 'logout' 
                                  ? "hover:bg-danger/10 hover:text-danger hover:border-danger/20" 
                                  : "hover:bg-accent/10 hover:text-accent hover:border-accent/20 hover:shadow-sm"
                              )}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/50 transition-colors group-hover:bg-background group-hover:text-current group-hover:shadow-sm">
                                <action.icon className="size-5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-foreground/80 group-hover:text-current transition-colors">{action.title}</div>
                                {action.href && <div className="text-[10px] text-foreground/40 truncate">{action.href}</div>}
                              </div>
                              <div className="ml-auto flex items-center justify-center size-6 rounded-full bg-foreground/5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                                <span className="text-[10px] font-bold">→</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border/10 bg-foreground/[0.02] px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-foreground/50">
                  <span>Press</span>
                  <kbd className="flex h-5 items-center justify-center rounded border border-border/20 bg-background px-1.5 font-mono shadow-sm">
                    <Command className="size-3 mr-0.5" /> K
                  </kbd>
                  <span>anywhere to search</span>
                </div>
                <div className="text-[11px] font-medium text-foreground/40">{filtered.length} results</div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
