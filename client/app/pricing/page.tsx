"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Sparkles, Trophy } from 'lucide-react';
import { getSubscriptionTier, setSubscriptionTier, SubscriptionTier } from '@/lib/subscription';

const tiers = [
  { 
    name: 'Starter' as SubscriptionTier, 
    price: '$49', 
    description: 'For small academies and test deployments.', 
    features: ['1 institution limit', 'Max 3 certificates (Free) / Unlimited (Subscribed)', 'Basic verification portal', 'Email notifications'],
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      setCurrentTier(getSubscriptionTier(userId));
    }
  }, [userId]);

  const handleSubscribe = (tierName: SubscriptionTier) => {
    if (status !== 'authenticated' || !userId) {
      toast.error('Please log in first to subscribe to a premium plan.');
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    if (currentTier === tierName) {
      toast.success(`You are already subscribed to the ${tierName} plan!`);
      return;
    }

    setSubscriptionTier(userId, tierName);
    setCurrentTier(tierName);
    toast.success(`Successfully subscribed to the ${tierName} plan!`);
  };

  const handleUnsubscribe = () => {
    if (userId) {
      setSubscriptionTier(userId, 'free');
      setCurrentTier('free');
      toast.success('Subscription cancelled. Reverted to Free tier.');
    }
  };

  return (
    <MarketingShell>
      <section className="px-4 py-24 relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
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

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {tiers.map((tier) => {
              const isCurrent = currentTier === tier.name;
              const TierIcon = tier.icon;
              
              return (
                <GlassCard 
                  key={tier.name}
                  className={`flex flex-col p-8 rounded-[32px] transition-all duration-300 border-2 ${
                    isCurrent 
                      ? 'border-emerald-500/80 bg-emerald-500/[0.02] shadow-glow-success' 
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
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 shrink-0 animate-pulse">
                        Active
                      </Badge>
                    )}
                    {tier.popular && !isCurrent && (
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
                    variant={isCurrent ? 'outline' : tier.popular ? 'default' : 'secondary'}
                    onClick={() => handleSubscribe(tier.name)}
                  >
                    {isCurrent ? 'Active Plan' : `Choose ${tier.name}`}
                  </Button>
                </GlassCard>
              );
            })}
          </div>

          {currentTier !== 'free' && (
            <div className="mt-16 text-center">
              <p className="text-sm text-foreground/60">
                Want to cancel your active premium subscription?{' '}
                <button 
                  onClick={handleUnsubscribe}
                  className="text-danger hover:text-danger/90 underline font-semibold transition"
                >
                  Downgrade to Free Tier
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
