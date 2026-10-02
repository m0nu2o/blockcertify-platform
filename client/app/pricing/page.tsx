"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Sparkles, Trophy, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import {
  fetchCurrentSubscription,
  requestSubscriptionPlan,
  cancelSubscriptionPlan,
  SubscriptionTier,
  PendingSubscriptionRequest,
} from '@/lib/subscription';

const tiers = [
  { 
    name: 'Starter' as SubscriptionTier, 
    price: '$49', 
    description: 'For small academies and test deployments.', 
    features: ['1 institution limit', 'Unlimited certificates (Active)', 'Basic verification portal', 'Email notifications'],
    icon: Star,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30 hover:border-sky-500/60'
  },
  { 
    name: 'Growth' as SubscriptionTier, 
    price: '$199', 
    description: 'For multi-department institutions and professional programs.', 
    features: ['5 institutions limit', 'Bulk CSV upload & issuance (Growth+)', 'Advanced analytics & CSV/PDF export', 'Priority database indexing'],
    icon: Sparkles,
    color: 'text-violet-400',
    popular: true,
    borderColor: 'border-violet-500/50 hover:border-violet-500/80'
  },
  { 
    name: 'Enterprise' as SubscriptionTier, 
    price: 'Custom', 
    description: 'For universities, federations, and high-volume networks.', 
    features: ['Unlimited institutions', 'Custom smart contract branding', 'Priority blockchain execution gas support', 'Security and compliance reviews'],
    icon: Trophy,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60'
  },
];

export default function PricingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [pendingRequest, setPendingRequest] = useState<PendingSubscriptionRequest | null>(null);
  const [rejectionInfo, setRejectionInfo] = useState<{ tier: string; reason?: string } | null>(null);
  const [submittingTier, setSubmittingTier] = useState<SubscriptionTier | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const isAdmin = session?.user?.role === 'admin';

  const loadSubscription = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchCurrentSubscription(token, userId);
      if (data) {
        setCurrentTier(data.tier || 'free');
        setPendingRequest(data.pendingRequest || null);
        if (data.latestRejected?.rejectionReason) {
          setRejectionInfo({
            tier: data.latestRejected.tier,
            reason: data.latestRejected.rejectionReason,
          });
        } else {
          setRejectionInfo(null);
        }
      }
    } catch {
      // Fallback silently if unauthenticated or network glitch
    } finally {
      setIsLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const handleSubscribe = async (tierName: SubscriptionTier) => {
    if (status !== 'authenticated' || !userId || !token) {
      toast.error('Please log in first to subscribe to a premium plan.');
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    if (currentTier === tierName && (!pendingRequest || pendingRequest.tier !== tierName)) {
      toast.info(`You are currently on the active ${tierName} plan.`);
      return;
    }

    if (pendingRequest?.tier === tierName) {
      toast.info(`Your request for the ${tierName} plan is already pending administrator approval.`);
      return;
    }

    try {
      setSubmittingTier(tierName);
      await requestSubscriptionPlan(tierName, token, userId);
      toast.success('Subscription request submitted successfully. Waiting for administrator approval.');
      await loadSubscription();
      await update?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit subscription request.';
      toast.error(message);
    } finally {
      setSubmittingTier(null);
    }
  };

  const handleUnsubscribe = async () => {
    if (!userId || !token) return;

    try {
      setCancelling(true);
      await cancelSubscriptionPlan(token, userId);
      toast.success('Subscription cancelled. Reverted to Free tier.');
      await loadSubscription();
      await update?.({ subscriptionTier: 'free' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription.';
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <MarketingShell>
      <section className="px-4 py-24 relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <div className="inline-flex rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">
              Pricing Plans
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              Pricing for trusted credential operations
            </h1>
            <p className="mt-6 text-lg text-foreground/80 leading-relaxed max-w-2xl mx-auto">
              Transparent tiers for emerging programs, growing institutions, and enterprise deployments.
            </p>
          </div>

          {/* Administrator Access Banner */}
          {isAdmin && (
            <div className="mx-auto max-w-3xl mb-10 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5 text-sky-200 flex items-start gap-3 shadow-glass">
              <Sparkles className="size-5 shrink-0 mt-0.5 text-sky-400" />
              <div className="text-sm leading-relaxed flex-1">
                <span className="font-semibold text-sky-300">Administrator Privileges Active:</span> As a platform administrator, your account is exempt from subscription limits. You have full access to issue certificates, bulk issue, and manage subscriptions across all institutions without needing to subscribe to a plan.
              </div>
            </div>
          )}

          {/* Pending Approval Banner */}
          {!isAdmin && pendingRequest && (
            <div className="mx-auto max-w-3xl mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 flex items-start gap-3 shadow-glass">
              <Clock className="size-5 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
              <div className="text-sm leading-relaxed flex-1">
                <span className="font-semibold text-amber-300">Pending Administrator Approval:</span> Your request for the <strong className="text-white underline">{pendingRequest.tier}</strong> plan submitted on {new Date(pendingRequest.requestedAt).toLocaleDateString()} is awaiting administrator review. Features will unlock once approved.
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-amber-300 hover:text-white shrink-0"
                onClick={() => void loadSubscription()}
                disabled={isLoading}
              >
                <RefreshCw className={`size-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          )}

          {/* Previous Rejection Alert */}
          {rejectionInfo && !pendingRequest && (
            <div className="mx-auto max-w-3xl mb-10 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-rose-200 flex items-start gap-3 shadow-glass">
              <AlertCircle className="size-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="text-sm leading-relaxed flex-1">
                <span className="font-semibold text-rose-300">Previous Request Update:</span> Your request for the <strong className="text-white">{rejectionInfo.tier}</strong> plan was rejected ({rejectionInfo.reason}). You are welcome to submit a new plan request below.
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {tiers.map((tier) => {
              const isCurrent = currentTier === tier.name && (!pendingRequest || pendingRequest.tier !== tier.name);
              const isPending = pendingRequest?.tier === tier.name;
              const isSubmitting = submittingTier === tier.name;
              const TierIcon = tier.icon;
              
              return (
                <GlassCard 
                  key={tier.name}
                  className={`flex flex-col p-8 rounded-[32px] transition-all duration-300 border-2 ${
                    isCurrent 
                      ? 'border-emerald-500/80 bg-emerald-500/[0.02] shadow-glow-success' 
                      : isPending
                        ? 'border-amber-500/80 bg-amber-500/[0.02] shadow-glow-warning'
                        : tier.popular 
                          ? 'border-violet-500/60 bg-violet-500/[0.02] shadow-glow' 
                          : tier.borderColor
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <TierIcon className={`size-6 ${tier.color} drop-shadow-md`} />
                      {tier.name}
                    </div>
                    {isCurrent && (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 shrink-0">
                        Active
                      </Badge>
                    )}
                    {isPending && (
                      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 shrink-0 animate-pulse">
                        Pending Approval
                      </Badge>
                    )}
                    {tier.popular && !isCurrent && !isPending && (
                      <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-400 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 shrink-0">
                        Popular
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 text-5xl font-black text-foreground tracking-tight flex items-baseline">
                    {tier.price}
                    {tier.price !== 'Custom' && (
                      <span className="text-base font-semibold text-foreground/70 ml-1">/month</span>
                    )}
                  </div>
                  
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed font-medium min-h-[48px]">
                    {tier.description}
                  </p>
                  
                  <div className="mt-8 space-y-4 text-sm text-foreground/90 flex-1 border-t border-border/12 pt-6">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <Check className="size-5 text-emerald-400 shrink-0 mt-0.5 drop-shadow-sm" /> 
                        <span className="leading-snug font-medium text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="mt-8 w-full py-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200"
                    variant={isAdmin ? 'outline' : isCurrent ? 'outline' : isPending ? 'secondary' : tier.popular ? 'default' : 'secondary'}
                    disabled={isAdmin || isCurrent || isPending || isSubmitting || submittingTier !== null}
                    onClick={() => handleSubscribe(tier.name)}
                  >
                    {isAdmin ? (
                      'Administrator Access (Exempt)'
                    ) : isCurrent ? (
                      'Current Plan (Active)'
                    ) : isPending ? (
                      'Pending Approval'
                    ) : isSubmitting ? (
                      'Submitting Request...'
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </Button>
                </GlassCard>
              );
            })}
          </div>

          {!isAdmin && currentTier !== 'free' && (
            <div className="mt-16 text-center">
              <p className="text-sm text-foreground/60">
                Want to cancel your active premium subscription?{' '}
                <button 
                  onClick={handleUnsubscribe}
                  disabled={cancelling}
                  className="text-danger hover:text-danger/90 underline font-semibold transition"
                >
                  {cancelling ? 'Cancelling...' : 'Downgrade to Free Tier'}
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
