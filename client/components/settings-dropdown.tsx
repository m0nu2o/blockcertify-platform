"use client";

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, X, Shield, Trash2, ShieldCheck, EyeOff, Globe, BellRing, Monitor, SlidersHorizontal, Type, Smartphone, Clock, Key, FileText, Timer } from 'lucide-react';
import { fonts } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { useFont } from '@/contexts/font-provider';
import { toast } from 'sonner';

import { useLanguage } from '@/contexts/language-provider';
import { usePreferences } from '@/contexts/preferences-provider';

export function SettingsDropdown({
  align = 'end',
  direction = 'down',
  isCollapsed = false,
  fullWidth = false,
}: {
  align?: 'start' | 'end' | 'center';
  direction?: 'up' | 'down';
  isCollapsed?: boolean;
  fullWidth?: boolean;
}) {
  const { font, setFont } = useFont();
  const { t, language, setLanguage } = useLanguage();
  const { compactMode, setCompactMode } = usePreferences();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'font' | 'security' | 'preferences' | 'language'>('preferences');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [open]);

  const handleClearCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('blockcertify-') ||
          key === 'web3_account' ||
          key === 'font' ||
          key === 'language' ||
          key === 'compactMode')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('blockcertify-') || key === 'web3_account')) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));

    toast.success('BlockCertify application cache cleared successfully! Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const languageLabels: Record<string, string> = {
    'en': 'English (US)',
    'es': 'Spanish (ES)',
    'fr': 'French (FR)',
    'de': 'German (DE)',
    'ja': 'Japanese (JA)',
    'hi': 'Hindi (HI)',
    'gu': 'Gujarati (GU)'
  };

  return (
    <div ref={dropdownRef} className={cn("relative", fullWidth ? "w-full flex flex-col-reverse" : "inline-block")}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Open Settings"
        className={cn(
          "flex items-center justify-center rounded-xl border border-border/15 bg-foreground/[0.04] text-foreground transition hover:bg-foreground/[0.07] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isCollapsed ? "size-12 rounded-full mx-auto" : "size-10 mt-2",
          fullWidth && !isCollapsed && "w-full"
        )}
      >
        <Settings className="size-4.5 text-accent shrink-0" />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isCollapsed ? 0 : (direction === 'up' ? 10 : -10), x: isCollapsed ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isCollapsed ? 0 : (direction === 'up' ? 10 : -10), x: isCollapsed ? -10 : 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "absolute z-50",
              fullWidth && !isCollapsed ? "w-full min-w-[280px]" : "w-[280px] sm:w-[300px]",
              isCollapsed 
                ? "left-full bottom-0 ml-3" 
                : cn(direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3', align === 'end' ? 'right-0' : align === 'start' ? 'left-0 sm:left-auto sm:right-0' : 'left-1/2 -translate-x-1/2')
            )}
          >
            <div className="p-3.5 shadow-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1322] text-slate-900 dark:text-foreground rounded-2xl w-full flex flex-col gap-3 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                    {mode === 'preferences' ? t('settings.preferences') : mode === 'language' ? t('settings.language') : mode === 'font' ? 'Select Font' : t('settings.security')}
                  </span>
                  <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1 text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-colors ml-auto -mt-1 -mr-1">
                    <X className="size-4" />
                  </button>
                </div>
                
                {mode === 'preferences' && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setCompactMode(!compactMode)}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl border transition-colors text-left",
                        compactMode ? "border-accent/30 bg-accent/10 text-accent" : "border-border/10 hover:bg-foreground/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", compactMode ? "bg-accent/20" : "bg-foreground/5")}>
                        <Monitor className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Compact UI</span>
                        <span className="text-[10px] opacity-70 leading-tight">Reduce padding & margins</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setNotifications(!notifications)}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl border transition-colors text-left",
                        notifications ? "border-accent/30 bg-accent/10 text-accent" : "border-border/10 hover:bg-foreground/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", notifications ? "bg-accent/20" : "bg-foreground/5")}>
                        <BellRing className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Push Notifications</span>
                        <span className="text-[10px] opacity-70 leading-tight">Alerts for verifications</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setMode('language')}
                      className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-foreground/5 shrink-0">
                        <Globe className="size-4 text-foreground/60" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t('settings.language')}</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">{languageLabels[language] || language}</span>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-colors text-left">
                      <div className="p-2 rounded-lg bg-foreground/5 shrink-0">
                        <Clock className="size-4 text-foreground/60" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Timezone</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">UTC+00:00 Auto</span>
                      </div>
                    </button>
                  </div>
                )}

                {mode === 'language' && (
                  <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto scrollbar-hide pr-1" data-lenis-prevent="true">
                    {(Object.keys(languageLabels) as Array<keyof typeof languageLabels>).map((langCode) => (
                      <button
                        key={langCode}
                        onClick={() => { setLanguage(langCode as any); setMode('preferences'); }}
                        className={cn(
                          'flex items-center justify-between rounded-xl border transition-all duration-300 p-3 text-left w-full',
                          language === langCode
                            ? 'border-accent/50 bg-accent/15 text-foreground shadow-glow ring-1 ring-accent/20'
                            : 'border-border/10 bg-foreground/[0.02] text-foreground/60 hover:border-border/20 hover:bg-foreground/[0.06] hover:text-foreground'
                        )}
                      >
                        <span className="text-sm font-semibold">{languageLabels[langCode]}</span>
                        {language === langCode && <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'font' && (
                  <div
                    className="flex flex-col max-h-[240px] overflow-y-auto scrollbar-hide pr-1 gap-2"
                    data-lenis-prevent="true"
                  >
                    {fonts.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setFont(item.name)}
                        className={cn(
                          'flex items-center justify-between rounded-xl border transition-all duration-300 p-3 text-left w-full',
                          font === item.name
                            ? 'border-accent/50 bg-accent/15 text-foreground shadow-glow ring-1 ring-accent/20'
                            : 'border-border/10 bg-foreground/[0.02] text-foreground/60 hover:border-border/20 hover:bg-foreground/[0.06] hover:text-foreground',
                          item.variable
                        )}
                      >
                        <span className="text-sm font-semibold truncate font-sans">{item.label}</span>
                        {font === item.name && <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'security' && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setPrivacyMode(!privacyMode)}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl border transition-colors text-left",
                        privacyMode ? "border-accent/30 bg-accent/10 text-accent" : "border-border/10 hover:bg-foreground/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", privacyMode ? "bg-accent/20" : "bg-foreground/5")}>
                        {privacyMode ? <EyeOff className="size-4" /> : <ShieldCheck className="size-4 text-foreground/60" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{privacyMode ? 'Privacy Mode Active' : 'Enable Privacy Mode'}</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">Hides sensitive wallet info</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl border transition-colors text-left",
                        twoFactor ? "border-success/30 bg-success/10 text-success" : "border-border/10 hover:bg-foreground/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg shrink-0", twoFactor ? "bg-success/20" : "bg-foreground/5")}>
                        <Smartphone className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Two-Factor Auth</span>
                        <span className="text-[10px] opacity-70 leading-tight">{twoFactor ? 'Configured (App)' : 'Not configured'}</span>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-colors text-left">
                      <div className="p-2 rounded-lg bg-foreground/5 shrink-0"><Key className="size-4 text-foreground/60" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">API Keys</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">Manage developer access</span>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-colors text-left">
                      <div className="p-2 rounded-lg bg-foreground/5 shrink-0"><Timer className="size-4 text-foreground/60" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Auto-Lock</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">15 minutes idle</span>
                      </div>
                    </button>
                    
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-colors text-left">
                      <div className="p-2 rounded-lg bg-foreground/5 shrink-0"><FileText className="size-4 text-foreground/60" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Audit Logs</span>
                        <span className="text-[10px] text-foreground/50 leading-tight">View account activity</span>
                      </div>
                    </button>

                    <button 
                      onClick={handleClearCache}
                      className="flex items-center gap-3 w-full p-3 rounded-xl border border-danger/20 hover:bg-danger/10 text-danger transition-colors text-left mt-2"
                    >
                      <div className="p-2 rounded-lg bg-danger/10 shrink-0">
                        <Trash2 className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Clear Local Cache</span>
                        <span className="text-[10px] opacity-70 leading-tight">Reset preferences & reload</span>
                      </div>
                    </button>
                  </div>
                )}

                <div className="flex gap-1 pt-2 border-t border-border/10 w-full mt-1">
                  <button 
                    onClick={() => setMode('preferences')}
                    title="Preferences"
                    className={cn("flex-1 flex items-center justify-center py-2 rounded-lg transition-colors", mode === 'preferences' ? "bg-accent/10 text-accent" : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70")}
                  >
                    <SlidersHorizontal className="size-4" />
                  </button>
                  <button 
                    onClick={() => setMode('font')}
                    title="Font Settings"
                    className={cn("flex-1 flex items-center justify-center py-2 rounded-lg transition-colors", mode === 'font' ? "bg-accent/10 text-accent" : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70")}
                  >
                    <Type className="size-4" />
                  </button>
                  <button 
                    onClick={() => setMode('security')}
                    title="Security & Privacy"
                    className={cn("flex-1 flex items-center justify-center py-2 rounded-lg transition-colors", mode === 'security' ? "bg-accent/10 text-accent" : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70")}
                  >
                    <Shield className="size-4" />
                  </button>
                </div>
              </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
