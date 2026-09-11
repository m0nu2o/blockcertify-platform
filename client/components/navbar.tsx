"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, User, LogOut, Bell, Camera, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { getAvatar, setAvatar } from '@/lib/db';
import { toast } from 'sonner';
import { Logo } from '@/components/logo';
import { SearchDialog } from '@/components/search-dialog';
import { useWeb3 } from '@/components/providers/web3-provider';
import { useLanguage } from '@/contexts/language-provider';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const { scrollY } = useScroll();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { account, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Image size must be less than 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      if (base64String && session?.user?.id) {
        const storageKey = `blockcertify-profile-pic-${session.user.id}`;
        await setAvatar(storageKey, base64String);
        setLocalAvatar(base64String);
        toast.success('Profile picture updated!');
        window.dispatchEvent(new Event('storage'));
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (session?.user?.id) {
      const storageKey = `blockcertify-profile-pic-${session.user.id}`;
      getAvatar(storageKey).then(setLocalAvatar);

      const handleStorageChange = () => {
        getAvatar(storageKey).then(setLocalAvatar);
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [session?.user?.id]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 10);
  });

  const mainLinks = [
    ['/', t('nav.home')],
    ['/verify', t('nav.verify')],
    ['/explorer', t('nav.explorer')],
    ['/pricing', t('nav.pricing')],
    ['/documentation', t('nav.docs')],
  ];

  const menuLinks = [
    ['/about', 'About'],
    ['/features', 'Features'],
    ['/services', 'Services'],
    ['/contact', 'Contact'],
  ];

  const allLinks = [...mainLinks, ...menuLinks];
  const isDropdownActive = menuLinks.some(([href]) => pathname === href);

  return (
    <header className="sticky top-4 z-50 px-4">
      <div className={cn(
        "mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-full px-5 py-3 transition-all duration-300",
        (isMounted && isScrolled) ? "bg-card/80 shadow-sm backdrop-blur-2xl border border-transparent" : "bg-transparent border border-transparent"
      )}>
        <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl group">
          <Logo className="size-10 transition-transform duration-300 group-hover:scale-105" />
          <div className="text-sm font-bold tracking-tight mt-0.5">BlockCertify</div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary navigation">
          {mainLinks.map(([href, label]) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative rounded-full px-5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-full bg-accent/10 border border-accent/20 shadow-glow"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="More navigation links"
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isDropdownActive || menuOpen
                  ? 'border-accent/20 bg-accent/10 text-foreground shadow-glow font-medium'
                  : 'border-transparent text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground'
              )}
            >
              More
              <ChevronDown className={`size-4 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute left-1/2 z-50 mt-2 w-48 -translate-x-1/2"
                  >
                    <GlassCard className="bg-card/95 p-2 shadow-glass">
                      <div className="grid gap-1">
                        {menuLinks.map(([href, label]) => {
                          const isActive = pathname === href;
                          return (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setMenuOpen(false)}
                              className={cn(
                                'rounded-xl px-4 py-2 text-sm transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                                isActive
                                  ? 'border-accent/20 bg-accent/10 text-foreground shadow-glow font-medium'
                                  : 'border-transparent text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground'
                              )}
                            >
                              {label}
                            </Link>
                          );
                        })}
                      </div>
                    </GlassCard>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {status === 'loading' ? (
            <div className="flex gap-3 items-center">
              <div className="h-9 w-24 rounded-full bg-foreground/5 animate-pulse" />
              <div className="h-9 w-28 rounded-full bg-foreground/5 animate-pulse" />
            </div>
          ) : status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              {account ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    <span className="text-xs font-medium text-accent">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                  <button 
                    onClick={disconnectWallet}
                    className="p-1.5 text-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    title="Disconnect Wallet"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="rounded-full gap-2 border-accent/20 bg-accent/5 text-accent hover:bg-accent/10"
                >
                  <Wallet className="size-4" />
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}

              <button 
                suppressHydrationWarning
                onClick={() => setSearchOpen(true)}
                className="relative p-2 text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent mr-1"
                aria-label="Search"
              >
                <Search className="size-5" />
              </button>

              <div className="relative">
                <button 
                  suppressHydrationWarning
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative p-2 text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Bell className="size-5" />
                  {hasUnread && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive animate-pulse" />}
                </button>
                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <button type="button" aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setNotificationsOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 z-50 mt-2 w-72"
                      >
                        <GlassCard className="bg-card/95 p-4 shadow-glass border border-border/10">
                           <div className="flex items-center justify-between mb-3">
                             <h3 className="text-sm font-semibold">Notifications</h3>
                             {hasUnread && <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20">2 New</Badge>}
                           </div>
                           <div className="space-y-2">
                             <div className={cn("rounded-lg p-2.5 transition-colors cursor-pointer", hasUnread ? "bg-accent/5 border border-accent/10" : "hover:bg-foreground/5")}>
                               <p className="text-xs font-medium">Welcome to BlockCertify!</p>
                               <p className="text-[10px] text-foreground/60 mt-1">Your account is ready to issue and verify credentials.</p>
                             </div>
                             <div className={cn("rounded-lg p-2.5 transition-colors cursor-pointer", hasUnread ? "bg-accent/5 border border-accent/10" : "hover:bg-foreground/5")}>
                               <p className="text-xs font-medium">Complete your profile</p>
                               <p className="text-[10px] text-foreground/60 mt-1">Add your institution details to get verified.</p>
                             </div>
                           </div>
                           {hasUnread && (
                             <button onClick={() => setHasUnread(false)} className="w-full text-center text-xs text-accent mt-3 pt-2 border-t border-border/10 hover:underline">Mark all as read</button>
                           )}
                        </GlassCard>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/dashboard">
                <Button className="rounded-full px-6 font-semibold shadow-glow focus-visible:ring-2 focus-visible:ring-accent">
                  Dashboard
                </Button>
              </Link>
              
              <div className="relative">
                <button 
                  suppressHydrationWarning
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center justify-center size-10 overflow-hidden rounded-full bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-glow"
                >
                  {localAvatar || session?.user?.image ? (
                    <Image src={localAvatar || session!.user!.image!} alt="Profile" width={40} height={40} className="size-full object-cover rounded-full" unoptimized />
                  ) : (
                    <User className="size-4.5" />
                  )}
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 z-50 mt-2 w-56"
                      >
                        <GlassCard className="bg-card/95 p-2 shadow-glass">
                          <div className="grid gap-1 text-sm">
                            <div className="px-3 py-2.5 text-xs text-foreground/50 font-medium mb-1 border-b border-border/10 tracking-widest uppercase">My Account</div>
                            
                            <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/5 transition-colors text-foreground/80 hover:text-foreground text-left">
                              <Camera className="size-4" /> Change Photo
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                            <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/5 transition-colors text-foreground/80 hover:text-foreground">
                              <User className="size-4" /> Profile Details
                            </Link>
                            
                            <button 
                              suppressHydrationWarning
                              onClick={() => { 
                                setUserMenuOpen(false); 
                                signOut({ redirect: false });
                                window.location.href = '/login';
                              }} 
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-colors text-left mt-1 border-t border-border/10 pt-2"
                            >
                              <LogOut className="size-4" /> Sign Out
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" className="rounded-full px-5 focus-visible:ring-2 focus-visible:ring-accent">{t('nav.login')}</Button></Link>
              <Link href="/register"><Button className="rounded-full px-6 shadow-glow focus-visible:ring-2 focus-visible:ring-accent">{t('nav.getStarted')}</Button></Link>
            </div>
          )}
          <ThemeSwitcher align="end" />
        </div>

        <button
          suppressHydrationWarning
          className="lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1"
          aria-label="Toggle mobile menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer — now animated with AnimatePresence */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-border/12 bg-card/90 p-4 shadow-glass backdrop-blur-2xl lg:hidden"
          >
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {allLinks.map(([href, label]) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm transition-all duration-200 border',
                      isActive
                        ? 'border-accent/20 bg-accent/10 text-foreground font-medium'
                        : 'border-transparent text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-border/10 pt-3">
              {status === 'loading' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 rounded-xl bg-foreground/5 animate-pulse" />
                  <div className="h-10 rounded-xl bg-foreground/5 animate-pulse" />
                </div>
              ) : status === 'authenticated' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/dashboard"><Button variant="secondary" className="w-full rounded-xl">Dashboard</Button></Link>
                  <Button className="w-full rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login"><Button variant="secondary" className="w-full rounded-xl">Login</Button></Link>
                  <Link href="/register"><Button className="w-full rounded-xl">Get Started</Button></Link>
                </div>
              )}
              <div className="pt-3">
                <ThemeSwitcher align="start" direction="up" fullWidth />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
