import { Types } from 'mongoose';
import Subscription, { ISubscription, SubscriptionTier, SubscriptionStatus } from '../models/Subscription.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from './auditService.js';
import { Request } from 'express';

export const FEATURE_LIMITS = {
  free: {
    maxCertificates: 3,
    allowBulk: false,
    maxBulkRows: 0,
    maxInstitutions: 1,
    allowAdvancedAnalytics: false,
    allowCustomContract: false,
  },
  Starter: {
    maxCertificates: Infinity,
    allowBulk: true,
    maxBulkRows: 50,
    maxInstitutions: 1,
    allowAdvancedAnalytics: false,
    allowCustomContract: false,
  },
  Growth: {
    maxCertificates: Infinity,
    allowBulk: true,
    maxBulkRows: 200,
    maxInstitutions: 5,
    allowAdvancedAnalytics: true,
    allowCustomContract: false,
  },
  Enterprise: {
    maxCertificates: Infinity,
    allowBulk: true,
    maxBulkRows: 200,
    maxInstitutions: Infinity,
    allowAdvancedAnalytics: true,
    allowCustomContract: true,
  },
} as const;

export const checkFeatureAccess = (tier: SubscriptionTier = 'free') => {
  return FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
};

export const getEffectiveInstitutionTier = (
  institution: { subscription?: { tier?: string; status?: string; expiresAt?: Date } } | null | undefined
): SubscriptionTier => {
  if (!institution || !institution.subscription) return 'free';
  const { tier, status, expiresAt } = institution.subscription;
  if (!tier || tier === 'free') return 'free';
  if (status && status !== 'active' && status !== 'pending') return 'free';
  if (expiresAt && new Date(expiresAt) < new Date()) return 'free';
  return (tier as SubscriptionTier) || 'free';
};

export const requestSubscription = async ({
  userId,
  tier,
  req,
}: {
  userId: string;
  tier: SubscriptionTier;
  req?: Request;
}) => {
  if (!['Starter', 'Growth', 'Enterprise'].includes(tier)) {
    throw new ApiError(400, 'Invalid subscription tier requested. Must be Starter, Growth, or Enterprise.');
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found or account is deactivated');
  }

  const institution = user.institution ? await Institution.findById(user.institution) : null;
  const currentTier = institution?.subscription?.tier || user.subscription?.tier || 'free';
  const currentStatus = institution?.subscription?.status || user.subscription?.status || 'active';

  // Check if user is already actively on this tier
  if (currentStatus === 'active' && currentTier === tier) {
    throw new ApiError(400, `You are already subscribed to the ${tier} plan.`);
  }

  // Prevent duplicate pending requests
  const pendingQuery: Record<string, unknown>[] = [{ user: user._id }];
  if (institution) {
    pendingQuery.push({ institution: institution._id });
  }

  const existingPending = await Subscription.findOne({
    $or: pendingQuery,
    status: 'pending',
  });

  if (existingPending) {
    throw new ApiError(
      409,
      `You already have a pending subscription request for the ${existingPending.tier} plan. Waiting for administrator approval.`
    );
  }

  const subscription = await Subscription.create({
    user: user._id,
    institution: institution ? institution._id : undefined,
    tier,
    status: 'pending',
    requestedAt: new Date(),
  });

  // Mark pending status on user & institution without wiping out current active tier
  user.subscription = {
    ...user.subscription,
    tier: user.subscription?.tier || 'free',
    status: 'pending',
    updatedAt: new Date(),
    subscriptionId: subscription._id as Types.ObjectId,
  };
  await user.save();

  if (institution) {
    institution.subscription = {
      ...institution.subscription,
      tier: institution.subscription?.tier || 'free',
      status: 'pending',
      updatedAt: new Date(),
      subscriptionId: subscription._id as Types.ObjectId,
    };
    await institution.save();
  }

  if (req) {
    await createAuditLog({
      req,
      actor: user.id,
      actorEmail: user.email,
      action: 'subscription.requested',
      entity: 'Subscription',
      entityId: subscription.id,
      metadata: { tier, institutionId: institution?.id },
    });
  }

  return subscription;
};

export const approveSubscription = async ({
  subscriptionId,
  adminId,
  req,
}: {
  subscriptionId: string;
  adminId: string;
  req?: Request;
}) => {
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new ApiError(403, 'Administrator privileges required to approve subscription requests');
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new ApiError(404, 'Subscription request not found');
  }

  if (subscription.status !== 'pending') {
    throw new ApiError(400, `Subscription request is not pending approval (currently ${subscription.status})`);
  }

  // Cancel prior active subscriptions for this user or institution
  const supersedeQuery: Record<string, unknown>[] = [{ user: subscription.user }];
  if (subscription.institution) {
    supersedeQuery.push({ institution: subscription.institution });
  }

  await Subscription.updateMany(
    {
      _id: { $ne: subscription._id },
      $or: supersedeQuery,
      status: 'active',
    },
    {
      $set: { status: 'cancelled', updatedAt: new Date() },
    }
  );

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

  subscription.status = 'active';
  subscription.approvedAt = new Date();
  subscription.approvedBy = admin._id as Types.ObjectId;
  subscription.expiresAt = expiresAt;
  subscription.rejectionReason = undefined;
  await subscription.save();

  // Update user subscription
  await User.findByIdAndUpdate(subscription.user, {
    'subscription.tier': subscription.tier,
    'subscription.status': 'active',
    'subscription.updatedAt': new Date(),
    'subscription.expiresAt': expiresAt,
    'subscription.subscriptionId': subscription._id,
  });

  // Authoritatively update institution subscription if linked
  if (subscription.institution) {
    await Institution.findByIdAndUpdate(subscription.institution, {
      'subscription.tier': subscription.tier,
      'subscription.status': 'active',
      'subscription.updatedAt': new Date(),
      'subscription.expiresAt': expiresAt,
      'subscription.subscriptionId': subscription._id,
    });
  }

  if (req) {
    await createAuditLog({
      req,
      actor: admin.id,
      actorEmail: admin.email,
      action: 'subscription.approved',
      entity: 'Subscription',
      entityId: subscription.id,
      metadata: {
        tier: subscription.tier,
        userId: String(subscription.user),
        institutionId: subscription.institution ? String(subscription.institution) : undefined,
      },
    });
  }

  return subscription;
};

export const rejectSubscription = async ({
  subscriptionId,
  adminId,
  reason,
  req,
}: {
  subscriptionId: string;
  adminId: string;
  reason?: string;
  req?: Request;
}) => {
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new ApiError(403, 'Administrator privileges required to reject subscription requests');
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new ApiError(404, 'Subscription request not found');
  }

  if (subscription.status !== 'pending') {
    throw new ApiError(400, `Subscription request is not pending approval (currently ${subscription.status})`);
  }

  subscription.status = 'rejected';
  subscription.approvedBy = admin._id as Types.ObjectId;
  subscription.rejectionReason = reason?.trim() || 'Rejected by administrator';
  await subscription.save();

  // Restore active status with current or fallback tier on User
  const user = await User.findById(subscription.user);
  if (user) {
    const priorActive = await Subscription.findOne({
      user: user._id,
      status: 'active',
    }).sort({ approvedAt: -1 });

    user.subscription = {
      tier: priorActive ? priorActive.tier : 'free',
      status: 'active',
      updatedAt: new Date(),
      expiresAt: priorActive?.expiresAt,
      subscriptionId: priorActive?._id as Types.ObjectId,
    };
    await user.save();
  }

  if (subscription.institution) {
    const institution = await Institution.findById(subscription.institution);
    if (institution) {
      const priorActiveInst = await Subscription.findOne({
        institution: institution._id,
        status: 'active',
      }).sort({ approvedAt: -1 });

      institution.subscription = {
        tier: priorActiveInst ? priorActiveInst.tier : 'free',
        status: 'active',
        updatedAt: new Date(),
        expiresAt: priorActiveInst?.expiresAt,
        subscriptionId: priorActiveInst?._id as Types.ObjectId,
      };
      await institution.save();
    }
  }

  if (req) {
    await createAuditLog({
      req,
      actor: admin.id,
      actorEmail: admin.email,
      action: 'subscription.rejected',
      entity: 'Subscription',
      entityId: subscription.id,
      metadata: {
        tier: subscription.tier,
        reason: subscription.rejectionReason,
        userId: String(subscription.user),
      },
    });
  }

  return subscription;
};

export const cancelSubscription = async ({
  userId,
  req,
}: {
  userId: string;
  req?: Request;
}) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const institution = user.institution ? await Institution.findById(user.institution) : null;

  const cancelQuery: Record<string, unknown>[] = [{ user: user._id }];
  if (institution) {
    cancelQuery.push({ institution: institution._id });
  }

  await Subscription.updateMany(
    {
      $or: cancelQuery,
      status: { $in: ['active', 'pending'] },
    },
    {
      $set: { status: 'cancelled', updatedAt: new Date() },
    }
  );

  user.subscription = {
    tier: 'free',
    status: 'active',
    updatedAt: new Date(),
    expiresAt: undefined,
    subscriptionId: undefined,
  };
  await user.save();

  if (institution) {
    institution.subscription = {
      tier: 'free',
      status: 'active',
      updatedAt: new Date(),
      expiresAt: undefined,
      subscriptionId: undefined,
    };
    await institution.save();
  }

  if (req) {
    await createAuditLog({
      req,
      actor: user.id,
      actorEmail: user.email,
      action: 'subscription.cancelled',
      entity: 'Subscription',
      entityId: user.id,
      metadata: { revertedTo: 'free' },
    });
  }

  return { tier: 'free' as const, status: 'active' as const };
};

export const getCurrentSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const institution = user.institution ? await Institution.findById(user.institution) : null;

  // Institution tier is authoritative for institutions, user tier is authoritative otherwise
  let effectiveTier: SubscriptionTier = institution?.subscription?.tier || user.subscription?.tier || 'free';
  let effectiveStatus: SubscriptionStatus = institution?.subscription?.status || user.subscription?.status || 'active';
  let expiresAt: Date | undefined = institution?.subscription?.expiresAt || user.subscription?.expiresAt;

  // Check expiration
  if (expiresAt && new Date(expiresAt) < new Date()) {
    effectiveTier = 'free';
    effectiveStatus = 'expired';
  }

  // Look for any pending subscription request
  const query: Record<string, unknown>[] = [{ user: user._id }];
  if (institution) {
    query.push({ institution: institution._id });
  }

  const pending = await Subscription.findOne({
    $or: query,
    status: 'pending',
  }).sort({ createdAt: -1 });

  // Look for latest rejected request for feedback
  const latestRejected = await Subscription.findOne({
    $or: query,
    status: 'rejected',
  }).sort({ updatedAt: -1 });

  return {
    tier: effectiveTier,
    status: effectiveStatus,
    expiresAt,
    pendingRequest: pending
      ? {
          _id: String(pending._id),
          tier: pending.tier,
          status: pending.status,
          requestedAt: pending.requestedAt,
        }
      : null,
    latestRejected: latestRejected
      ? {
          _id: String(latestRejected._id),
          tier: latestRejected.tier,
          status: latestRejected.status,
          rejectionReason: latestRejected.rejectionReason,
          updatedAt: latestRejected.updatedAt,
        }
      : null,
    institution: institution
      ? {
          _id: String(institution._id),
          name: institution.name,
          tier: institution.subscription?.tier || 'free',
          status: institution.subscription?.status || 'active',
        }
      : null,
  };
};

export const getSubscriptionRequests = async ({
  page = 1,
  limit = 50,
  status,
  tier,
}: {
  page?: number;
  limit?: number;
  status?: string;
  tier?: string;
}) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (tier) filter.tier = tier;

  const [items, total, pendingCount] = await Promise.all([
    Subscription.find(filter)
      .populate('user', 'name email role')
      .populate('institution', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Subscription.countDocuments(filter),
    Subscription.countDocuments({ status: 'pending' }),
  ]);

  return { items, total, pendingCount, page, limit };
};
