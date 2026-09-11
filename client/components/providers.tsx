"use client";

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/theme-provider';
import { useEffect } from 'react';

import { Web3Provider } from '@/components/providers/web3-provider';
import { PreferencesProvider } from '@/contexts/preferences-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      }
    }
  }, []);

  return (
    <PreferencesProvider>
      <SessionProvider>
        <Web3Provider>
          <ThemeProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast: 'bg-card/95 text-foreground border border-border/20 backdrop-blur-2xl shadow-glass rounded-2xl p-4 font-medium flex items-start gap-3 w-full max-w-[356px]',
                  title: 'text-sm font-semibold',
                  description: 'text-xs text-foreground/60 mt-1',
                  actionButton: 'bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90',
                  cancelButton: 'bg-foreground/5 text-foreground/60 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-foreground/10',
                  success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
                  error: 'border-danger/30 bg-danger/5 text-danger',
                  warning: 'border-warning/30 bg-warning/5 text-warning',
                  info: 'border-accent/30 bg-accent/5 text-accent',
                },
              }}
            />
          </ThemeProvider>
        </Web3Provider>
      </SessionProvider>
    </PreferencesProvider>
  );
}
