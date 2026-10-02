import { Schema, model, Document, Types } from 'mongoose';

export type SubscriptionTier = 'free' | 'Starter' | 'Growth' | 'Enterprise';
export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  institution?: Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  expiresAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', index: true },
    tier: {
      type: String,
      enum: ['free', 'Starter', 'Growth', 'Enterprise'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ institution: 1, status: 1 });
SubscriptionSchema.index({ status: 1, createdAt: -1 });

export default model<ISubscription>('Subscription', SubscriptionSchema);
