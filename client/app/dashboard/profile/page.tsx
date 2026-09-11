"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, KeyRound, Building, CheckCircle2, Camera, Trash2, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getSubscriptionTier, SubscriptionTier } from '@/lib/subscription';
import { getAvatar, setAvatar, removeAvatar } from '@/lib/db';

const roleLabels = {
  admin: 'Platform Administrator',
  institution: 'Institution Registrar',
  student: 'Verified Student',
} as const;

const roleDescriptions = {
  admin: 'Platform-wide configuration access, analytics dashboards, audit logs control, and institution approval permission.',
  institution: 'Permission to issue certificates, revoke certificates, seed student rosters, and update institution details.',
  student: 'Access to personal student dashboard, view issued certificates, and track credentials verification status.',
} as const;

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = session?.user?.id;
  const storageKey = userId ? `blockcertify-profile-pic-${userId}` : null;

  useEffect(() => {
    if (storageKey && userId) {
      getAvatar(storageKey).then(setProfilePic);
      setTier(getSubscriptionTier(userId));
    }
  }, [storageKey, userId]);

  // Listen for storage events to sync active subscription tier updates dynamically
  useEffect(() => {
    const handleStorageChange = () => {
      if (userId) {
        setTier(getSubscriptionTier(userId));
        getAvatar(`blockcertify-profile-pic-${userId}`).then(setProfilePic);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);

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
      if (base64String && storageKey) {
        await setAvatar(storageKey, base64String);
        setProfilePic(base64String);
        toast.success('Profile picture updated!');
        // Dispatch a storage event to notify other components (e.g. Sidebar)
        window.dispatchEvent(new Event('storage'));
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePic = async () => {
    if (storageKey) {
      await removeAvatar(storageKey);
      setProfilePic(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Profile picture removed.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (status === 'loading') {
    return (
      <DashboardShell title="My Profile">
        <GlassCard className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-foreground/60">Loading profile session...</p>
          </div>
        </GlassCard>
      </DashboardShell>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <DashboardShell title="My Profile">
        <GlassCard className="p-8 text-center text-danger border-danger/25 bg-danger/5">
          <p className="font-semibold text-lg">Access Denied</p>
          <p className="mt-2 text-sm text-foreground/60">You must be logged in to view your profile session.</p>
        </GlassCard>
      </DashboardShell>
    );
  }

  const { name, email, role, id, institutionStatus } = session.user;

  return (
    <DashboardShell title="My Profile">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Full-Width Banner: Avatar & Overview */}
        <GlassCard className="relative overflow-hidden p-0 border-border/10 shadow-glass-lg">
          {/* Banner Background */}
          <div className="h-32 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent border-b border-border/5" />
          
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-2">
              
              {/* Avatar */}
              <div className="relative group z-10 shrink-0">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="relative overflow-hidden rounded-full p-1.5 bg-card shadow-xl cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 block border border-border/10"
                  aria-label="Change profile picture"
                >
                  <div className="rounded-full bg-foreground/[0.02] overflow-hidden">
                    {profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="size-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid size-32 place-items-center rounded-full text-foreground/40">
                        <User className="size-16" />
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-1.5 rounded-full flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-white text-xs backdrop-blur-sm border border-white/10">
                    <Camera className="size-6 mb-1 text-white/80" />
                    <span className="font-medium">Update</span>
                  </div>
                </button>

                <div className="absolute bottom-3 right-3 flex size-6 items-center justify-center rounded-full bg-success shadow-sm ring-4 ring-card" title="Active">
                  <CheckCircle2 className="size-4 text-white" />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name & Details */}
              <div className="text-center sm:text-left flex-1 pb-2 min-w-0">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground truncate">{name || 'User'}</h2>
                <p className="mt-1 text-base font-medium text-foreground/60 truncate">{email}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto pb-2">
                <Badge className="border-accent/20 bg-accent/10 text-accent font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-sm justify-center text-sm">
                  {roleLabels[role] || role}
                </Badge>
                {profilePic && (
                  <button
                    type="button"
                    onClick={removeProfilePic}
                    className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger/80 hover:text-danger hover:bg-danger/10 py-2 px-4 rounded-full transition-all"
                    title="Remove Photo"
                  >
                    <Trash2 className="size-4" /> Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
          
          {/* Left Column: Official Digital Identity */}
          <div className="space-y-6">
            <GlassCard className="p-0 overflow-hidden border-border/10">
              <div className="bg-foreground/[0.02] border-b border-border/10 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Shield className="size-5 text-accent" /> Official Digital Identity
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">Immutable session record linked to your cryptographic profile.</p>
                </div>
                <div className="hidden sm:block opacity-20">
                  <QrCode className="size-12" />
                </div>
              </div>
              
              <div className="p-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
                    <User className="size-3.5" /> Full Legal Name
                  </div>
                  <div className="font-semibold text-base text-foreground bg-foreground/[0.03] border border-border/5 rounded-xl px-4 py-3 truncate">{name || 'N/A'}</div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
                    <Mail className="size-3.5" /> Contact Email
                  </div>
                  <div className="font-semibold text-base bg-foreground/[0.03] border border-border/5 rounded-xl px-4 py-3 truncate shadow-inner">
                    {email ? (
                      <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent block truncate">{email}</span>
                    ) : (
                      <span className="text-foreground/40 italic text-sm">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
                    <Shield className="size-3.5" /> Authorization Role
                  </div>
                  <div className="font-semibold text-base text-foreground bg-foreground/[0.03] border border-border/5 rounded-xl px-4 py-3 truncate">{roleLabels[role] || role}</div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/50">
                    <KeyRound className="size-3.5" /> Unique Identifier
                  </div>
                  <div className="flex items-center gap-2 bg-foreground/[0.03] border border-border/5 rounded-xl px-2 py-2 pr-4 transition-colors hover:bg-foreground/[0.05] min-w-0">
                    <div className="font-mono text-sm text-foreground flex-1 truncate px-2" title={id}>{id}</div>
                    <button
                      type="button"
                      title="Copy Identifier"
                      onClick={() => {
                        if (id) {
                          navigator.clipboard.writeText(id);
                          setCopied(true);
                          toast.success("Identifier copied to clipboard");
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all"
                    >
                      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Quick Stats & Permissions */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[20px] border border-border/12 bg-card p-5 shadow-sm transition-all hover:shadow-glow hover:border-accent/30 flex flex-col justify-between h-32">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground/50">Subscription</div>
                <div>
                  <div className="text-xl font-bold capitalize text-foreground">{tier}</div>
                  <Link 
                    href="/pricing"
                    className="mt-2 inline-flex text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                  >
                    Manage &rarr;
                  </Link>
                </div>
              </div>
              
              {institutionStatus ? (
                <div className="rounded-[20px] border border-border/12 bg-card p-5 shadow-sm transition-all hover:shadow-glow hover:border-accent/30 flex flex-col justify-between h-32">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground/50">Registrar</div>
                  <div>
                    <div className={`text-xl font-bold capitalize ${institutionStatus === 'approved' ? 'text-success' : 'text-warning'}`}>
                      {institutionStatus}
                    </div>
                    <div className="mt-2 text-[10px] leading-tight text-foreground/50">
                      {institutionStatus === 'approved' ? 'Full rights' : 'Under review'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] border border-border/12 bg-card p-5 shadow-sm transition-all hover:shadow-glow hover:border-accent/30 flex flex-col justify-between h-32">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground/50">Account</div>
                  <div>
                    <div className="text-xl font-bold capitalize text-success">Active</div>
                    <div className="mt-2 text-[10px] leading-tight text-foreground/50">In good standing</div>
                  </div>
                </div>
              )}
            </div>

            <GlassCard className="p-8 border-border/10">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
                <Building className="size-5 text-accent" /> Access & Permissions
              </h3>
              <div className="rounded-2xl bg-accent/5 border border-accent/10 p-5">
                <p className="text-sm font-medium text-foreground/80 leading-loose">
                  {roleDescriptions[role] || 'General platform access.'}
                </p>
              </div>
            </GlassCard>
            
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
