export type SubscriptionTier = 'free' | 'Starter' | 'Growth' | 'Enterprise';

export const getSubscriptionTier = (userId?: string): SubscriptionTier => {
  if (!userId) return 'free';
  if (typeof window === 'undefined') return 'free';
  const saved = localStorage.getItem(`blockcertify-tier-${userId}`);
  return (saved as SubscriptionTier) || 'free';
};

export const setSubscriptionTier = (userId: string, tier: SubscriptionTier) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`blockcertify-tier-${userId}`, tier);
  // Dispatch storage event so other open components/layouts update in real-time
  window.dispatchEvent(new Event('storage'));
};
