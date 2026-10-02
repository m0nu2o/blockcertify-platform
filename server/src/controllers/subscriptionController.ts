import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  requestSubscription,
  getCurrentSubscription,
  cancelSubscription,
} from '../services/subscriptionService.js';
import { SubscriptionTier } from '../models/Subscription.js';

const requestSubscriptionSchema = z.object({
  tier: z.enum(['Starter', 'Growth', 'Enterprise'] as const),
});

export const requestSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = requestSubscriptionSchema.parse(req.body);
  const subscription = await requestSubscription({
    userId: req.user!._id,
    tier: body.tier as SubscriptionTier,
    req,
  });

  return sendSuccess(
    res,
    { subscription },
    'Subscription request submitted successfully. Waiting for administrator approval.',
    201
  );
});

export const getCurrentSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getCurrentSubscription(req.user!._id);
  return sendSuccess(res, data, 'Current subscription details');
});

export const cancelSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await cancelSubscription({
    userId: req.user!._id,
    req,
  });

  return sendSuccess(res, result, 'Subscription cancelled successfully');
});
