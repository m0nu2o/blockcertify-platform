"use client";

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Blocks, 
  ChartBarBig, 
  FileBadge2, 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Shield, 
  UserSquare2, 
  User, 
  ArrowLeft, 
  Crown,
  Sparkles,
  Wallet,
  LayoutTemplate,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { SettingsDropdown } from '@/components/settings-dropdown';
import { useWeb3 } from '@/components/providers/web3-provider';
import { NotificationDropdown } from '@/components/dashboard/notification-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAvatar } from '@/lib/db';

const workspaceNavigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'institution', 'student'] },
  { href: '/dashboard/admin', label: 'Admin Console', icon: Shield, roles: ['admin'] },
  { href: '/dashboard/institution', label: 'Institution Hub', icon: FileBadge2, roles: ['admin', 'institution'] },
  { href: '/dashboard/student', label: 'Student Profile', icon: UserSquare2, roles: ['admin', 'student'] },
];

const toolNavigation = [
  { href: '/verify', label: 'Verify Portal', icon: Shield, roles: ['admin', 'institution', 'student'] },
  { href: '/dashboard/institution/designer', label: 'Template Designer', icon: LayoutTemplate, roles: ['admin', 'institution'] },
  { href: '/dashboard/institution/approvals', label: 'Approvals Queue', icon: CheckCircle, roles: ['admin', 'institution'] },
  { href: '/dashboard/design-preview', label: 'Design Lab', icon: Sparkles, roles: ['admin', 'institution', 'student'] },
  { href: '/documentation', label: 'Docs Hub', icon: ChartBarBig, roles: ['admin', 'institution', 'student'] },
];

const accessDeniedMessages = {
  admin: 'Admin access is required for that page.',
  institution: 'Only institution and admin accounts can open that page.',
  student: 'Only student and admin accounts can open that page.',
} as const;

const roleLabels = {
  admin: 'Administrator',
  institution: 'Institution',
  student: 'Student',
} as const;

function AccessDeniedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessDenied = searchParams.get('accessDenied') as keyof typeof accessDeniedMessages | null;
    if (!accessDenied) return;

    toast.error(accessDeniedMessages[accessDenied]);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('accessDenied');
    const nextUrl = nextParams.toString() ? `/dashboard?${nextParams.toString()}` : '/dashboard';
    router.replace(nextUrl);
  }, [router, searchParams]);

  return null;
}

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState('');

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      const savedPic = await getAvatar(`blockcertify-profile-pic-${userId}`);
      setProfilePic(savedPic);
      const savedTier = localStorage.getItem(`blockcertify-tier-${userId}`) || 'free';
      setTier(savedTier);
    };

    loadData();

    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [userId]);

  const { account, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  const normalizedSidebarQuery = sidebarQuery.trim().toLowerCase();

  const filteredWorkspaceNav = workspaceNavigation.filter(
    (item) => (!userRole || item.roles.includes(userRole)) && item.label.toLowerCase().includes(normalizedSidebarQuery)
  );

  const filteredToolNav = toolNavigation.filter(
    (item) => (!userRole || item.roles.includes(userRole)) && item.label.toLowerCase().includes(normalizedSidebarQuery)
  );

  const showProfileLink = 'my profile'.includes(normalizedSidebarQuery);
  const showExitLink = 'exit to website'.includes(normalizedSidebarQuery);
  const hasSidebarResults = filteredWorkspaceNav.length > 0 || filteredToolNav.length > 0 || showProfileLink || showExitLink;

  return (
    <>
      <Suspense fallback={null}>
        <AccessDeniedToast />
      </Suspense>
      <div className="min-h-screen px-4 py-6">
        <div className={cn("mx-auto grid max-w-7xl gap-6 transition-[grid-template-columns] duration-300 ease-in-out", isCollapsed ? "lg:grid-cols-[88px,1fr]" : "lg:grid-cols-[280px,1fr]")}>
          
          {/* Sidebar Panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "relative z-50 flex flex-col rounded-[32px] border border-white/10 bg-card/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-[40px] transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:bg-gradient-to-b before:from-accent/20 before:to-transparent lg:sticky lg:top-6 lg:h-[calc(100dvh-48px)] lg:min-h-0",
              isCollapsed && "items-center"
            )}
          >
            {/* Edge highlights */}
            <div className="absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent pointer-events-none rounded-t-[32px]" />
            <div className="absolute inset-y-8 left-0 w-[1px] bg-gradient-to-b from-transparent via-accent/30 to-transparent pointer-events-none rounded-l-[32px]" />
            
            {/* Main Navigation Container */}
            <div 
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col px-5 pt-5 pb-0",
                isCollapsed && "px-3"
              )} 
            >
                <div className={cn("mb-8 flex shrink-0 relative group w-full", isCollapsed ? "flex-col items-center gap-4" : "items-start justify-between")}>
                  <div className="absolute -inset-4 rounded-3xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
                  <div className={cn("flex flex-col", isCollapsed ? "items-center" : "gap-1")}>
                    <Link href="/dashboard" className={cn("flex items-center gap-3 relative z-10", isCollapsed && "justify-center")}>
                      <div className={cn("grid place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-[0_0_25px_rgba(var(--accent),0.6)] text-white ring-1 ring-white/20 shrink-0", isCollapsed ? "size-10" : "size-11")}>
                        <Blocks className="size-5" />
                      </div>
                      {!isCollapsed && (
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap shrink-0">
                          <div className="text-[22px] font-bold tracking-tight text-foreground leading-none">BlockCertify</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mt-1">Control Console</div>
                        </motion.div>
                      )}
                    </Link>
                    {!isCollapsed && userRole ? <Badge className="mt-4 border-accent/30 bg-accent/10 text-accent font-semibold w-fit relative z-10">{roleLabels[userRole]}</Badge> : null}
                  </div>

                  {/* Collapse Toggle Button - Reverted to Original position */}
                  <button
                    suppressHydrationWarning
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                      "hidden lg:flex shrink-0 items-center justify-center rounded-full border border-border/20 bg-foreground/[0.03] shadow-sm text-foreground/60 hover:text-foreground hover:bg-accent/10 transition-all hover:scale-110 z-50",
                      isCollapsed ? "size-8" : "size-8 mt-1.5"
                    )}
                    title={isCollapsed ? "Expand Console" : "Collapse Console"}
                  >
                    {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
                  </button>
                </div>

              {/* Navigation Results - Independently Scrollable */}
              <div 
                className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain pb-5 -mx-5 px-5"
                data-lenis-prevent="true"
              >
                {/* Section 1: Workspace Console */}
                {filteredWorkspaceNav.length > 0 && <div className={cn("text-[10px] shrink-0 font-bold text-foreground/40 uppercase tracking-widest px-4 mb-2 transition-all overflow-hidden whitespace-nowrap w-full", isCollapsed && "opacity-0 h-0 m-0 px-0")}>
                  Workspace
                </div>}
                {filteredWorkspaceNav.length > 0 && <nav className={cn("grid shrink-0 gap-1 relative mb-6 w-full", isCollapsed && "px-0")}>
                  {filteredWorkspaceNav.map((item) => {
                    const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center rounded-2xl text-sm transition-all duration-300 min-w-0 z-10 group overflow-visible',
                          isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-3",
                          isActive ? 'text-foreground font-semibold' : 'text-foreground/60 hover:text-foreground'
                        )}
                      >
                        {!isActive && (
                          <div className={cn("absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 -z-10 rounded-2xl")} />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] -z-10"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn('transition-colors duration-300 shrink-0 z-10', isCollapsed ? "size-[20px]" : "size-[18px]", isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]' : 'text-foreground/40 group-hover:text-accent')} />
                        {!isCollapsed && <span className="truncate z-10 transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>}

                {/* Section 2: Platform Tools */}
                {filteredToolNav.length > 0 && <div className={cn("text-[10px] shrink-0 font-bold text-foreground/40 uppercase tracking-widest px-4 mb-2 transition-all overflow-hidden whitespace-nowrap w-full", isCollapsed && "opacity-0 h-0 m-0 px-0")}>
                  Platform Utilities
                </div>}
                {filteredToolNav.length > 0 && <nav className={cn("grid shrink-0 gap-1 relative mb-6 w-full", isCollapsed && "px-0")}>
                  {filteredToolNav.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center rounded-2xl text-sm transition-all duration-300 min-w-0 z-10 group overflow-visible',
                          isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-3",
                          isActive ? 'text-foreground font-semibold' : 'text-foreground/60 hover:text-foreground'
                        )}
                      >
                        {!isActive && (
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 -z-10" />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] -z-10"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn('transition-colors duration-300 shrink-0 z-10', isCollapsed ? "size-[20px]" : "size-[18px]", isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]' : 'text-foreground/40 group-hover:text-accent')} />
                        {!isCollapsed && <span className="truncate z-10 transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>}

                {/* Section 3: Profile Settings */}
                {showProfileLink && <div className={cn("text-[10px] shrink-0 font-bold text-foreground/40 uppercase tracking-widest px-4 mb-2 transition-all overflow-hidden whitespace-nowrap w-full", isCollapsed && "opacity-0 h-0 m-0 px-0")}>
                  Account
                </div>}
                {showProfileLink && <nav className={cn("grid shrink-0 gap-1 mb-6 w-full", isCollapsed && "px-0")}>
                  <Link
                    href="/dashboard/profile"
                    title={isCollapsed ? 'My Profile' : undefined}
                    className={cn(
                      'relative flex items-center rounded-2xl text-sm transition-all duration-300 min-w-0 z-10 group overflow-visible',
                      isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-3",
                      pathname === '/dashboard/profile' ? 'text-foreground font-semibold' : 'text-foreground/60 hover:text-foreground'
                    )}
                  >
                    {pathname !== '/dashboard/profile' && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 -z-10" />
                    )}
                    {pathname === '/dashboard/profile' && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] -z-10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <User className={cn('transition-colors duration-300 shrink-0 z-10', isCollapsed ? "size-[20px]" : "size-[18px]", pathname === '/dashboard/profile' ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]' : 'text-foreground/40 group-hover:text-accent')} />
                    {!isCollapsed && <span className="truncate z-10 transition-transform duration-300 group-hover:translate-x-0.5">My Profile</span>}
                  </Link>
                </nav>}

                {!hasSidebarResults && !isCollapsed && (
                  <div className="mb-6 rounded-2xl border border-dashed border-border/15 bg-foreground/[0.02] px-4 py-6 text-center">
                    <Search className="mx-auto mb-2 size-4 text-foreground/35" />
                    <p className="text-xs font-medium text-foreground/60">No navigation matches</p>
                    <button type="button" onClick={() => setSidebarQuery('')} className="mt-1 text-xs text-accent hover:underline">Clear search</button>
                  </div>
                )}

                {/* Separator Divider */}
                {showExitLink && <div className="my-4 shrink-0 border-t border-border/10 w-full" />}

                {showExitLink && <nav className="grid shrink-0 gap-1 mb-2 mt-auto w-full">
                  <Link
                    href="/"
                    title={isCollapsed ? 'Exit to Website' : undefined}
                    className={cn("group relative flex items-center rounded-2xl text-sm transition-all duration-300 min-w-0 z-10 overflow-visible text-foreground/60 hover:text-foreground", isCollapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-3")}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    <ArrowLeft className={cn("text-foreground/40 transition-transform duration-300 group-hover:-translate-x-1 shrink-0 z-10", isCollapsed ? "size-[20px]" : "size-[18px]")} />
                    {!isCollapsed && <span className="truncate z-10">Exit to Website</span>}
                  </Link>
                </nav>}
              </div>
            </div>

            {/* Sidebar Footer - Unified Cohesive Container */}
            <div className={cn("pb-5 pt-4 border-t border-border/10 flex flex-col gap-3 w-full mt-auto", isCollapsed ? "px-3" : "px-5")}>
              <div className={cn("flex items-center gap-3 rounded-xl bg-foreground/[0.03] border border-border/10 p-2.5 transition-all", isCollapsed ? "justify-center p-2" : "px-3 py-2.5")}>
                <Link href="/dashboard/profile" className="relative group shrink-0">
                  <div className={cn("flex items-center justify-center rounded-full bg-accent/15 border border-accent/25 text-accent font-bold shadow-glow overflow-hidden transition-transform duration-200 group-hover:scale-105", isCollapsed ? "size-9" : "size-9")}>
                    {profilePic || session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profilePic || session!.user!.image!} alt="Profile" className="size-full object-cover rounded-full" />
                    ) : (
                      <User className="size-4" />
                    )}
                  </div>
                </Link>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                      {session?.user?.name || 'User'}
                      {tier !== 'free' && (
                        <span title={`${tier} Subscriber`} className="flex items-center">
                          <Crown className="size-3 text-warning shrink-0 fill-warning drop-shadow-md" />
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[10px] text-foreground/50 tracking-wide">{session?.user?.email || 'Guest'}</div>
                  </div>
                )}
              </div>

              <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "w-full")}>
                <Button 
                  suppressHydrationWarning
                  variant="secondary" 
                  size={isCollapsed ? "icon" : "sm"} 
                  className={cn("rounded-xl bg-foreground/[0.04] border border-border/12 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all duration-200", isCollapsed ? "size-10" : "flex-1 h-10")} 
                  onClick={() => {
                    signOut({ redirect: false });
                    window.location.href = '/login';
                  }} 
                  title={isCollapsed ? "Sign Out" : undefined}
                >
                  <LogOut className={cn(isCollapsed ? "size-4" : "size-4")} />
                  {!isCollapsed && "Sign out"}
                </Button>
                <div className={cn("shrink-0", isCollapsed ? "w-full" : "w-auto")}>
                  <SettingsDropdown align="start" direction="up" isCollapsed={isCollapsed} fullWidth={isCollapsed} />
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <main className="space-y-6 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-4 rounded-[30px] border border-border/12 bg-card/80 p-5 shadow-glass backdrop-blur-2xl md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-sm text-foreground/55">Real-time trust, analytics, and verification operations.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const query = formData.get('query');
                  if (query) {
                    router.push(`/verify?id=${query}`);
                  }
                }} 
                className="relative group"
              >
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                <Input name="query" className="pl-10 pr-10" placeholder="Search by Certificate ID..." />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100">
                  <ArrowRight className="size-3.5" />
                </button>
              </form>
                {account ? (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-mono hover:bg-emerald-500/10 hover:text-emerald-300 rounded-2xl h-10 px-4"
                    onClick={disconnectWallet}
                    aria-label={`Disconnect wallet ${account}`}
                  >
                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2 rounded-2xl border border-accent/25 hover:bg-accent/10 hover:text-accent font-semibold h-10 px-4"
                    onClick={connectWallet}
                    disabled={isConnecting}
                    aria-label="Connect Web3 Wallet"
                  >
                    <Wallet className="size-4" />
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                )}
                <NotificationDropdown />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0.92, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.02 }} className="space-y-6">
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}
