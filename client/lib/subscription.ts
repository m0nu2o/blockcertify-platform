import { apiFetch } from './api';

export type SubscriptionTier = 'free' | 'Starter' | 'Growth' | 'Enterprise';
export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';

export interface PendingSubscriptionRequest {
  _id: string;
  tier: SubscriptionTier;
  status: 'pending';
  requestedAt: string;
}

export interface CurrentSubscriptionResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt?: string;
  pendingRequest?: PendingSubscriptionRequest | null;
  latestRejected?: {
    _id: string;
    tier: SubscriptionTier;
    status: 'rejected';
    rejectionReason?: string;
    updatedAt: string;
  } | null;
  institution?: {
    _id: string;
    name: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  } | null;
}

export const getSubscriptionTier = (userId?: string): SubscriptionTier => {
  if (!userId) return 'free';
  if (typeof window === 'undefined') return 'free';
  const saved = localStorage.getItem(`blockcertify-tier-${userId}`);
  return (saved as SubscriptionTier) || 'free';
};

export const fetchCurrentSubscription = async (token: string, userId?: string): Promise<CurrentSubscriptionResponse> => {
  const result = await apiFetch<CurrentSubscriptionResponse>('/subscriptions/current', { token });
  if (typeof window !== 'undefined' && userId && result?.tier) {
    localStorage.setItem(`blockcertify-tier-${userId}`, result.tier);
    window.dispatchEvent(new Event('storage'));
  }
  return result;
};

export const requestSubscriptionPlan = async (tier: SubscriptionTier, token: string, userId?: string) => {
  const result = await apiFetch<{ subscription: unknown }>('/subscriptions/request', {
    method: 'POST',
    token,
    body: JSON.stringify({ tier }),
  });

  if (typeof window !== 'undefined' && userId) {
    // Keep local cache in sync, dispatch storage event
    window.dispatchEvent(new Event('storage'));
  }

  return result;
};

export const cancelSubscriptionPlan = async (token: string, userId?: string) => {
  const result = await apiFetch<{ tier: 'free'; status: 'active' }>('/subscriptions/cancel', {
    method: 'POST',
    token,
  });

  if (typeof window !== 'undefined' && userId) {
    localStorage.setItem(`blockcertify-tier-${userId}`, 'free');
    window.dispatchEvent(new Event('storage'));
  }

  return result;
};

export const setSubscriptionTier = async (userId: string, tier: SubscriptionTier, token?: string) => {
  if (typeof window === 'undefined') return;
  if (token) {
    if (tier === 'free') {
      await cancelSubscriptionPlan(token, userId);
    } else {
      await requestSubscriptionPlan(tier, token, userId);
    }
  }
  localStorage.setItem(`blockcertify-tier-${userId}`, tier);
  window.dispatchEvent(new Event('storage'));
};
