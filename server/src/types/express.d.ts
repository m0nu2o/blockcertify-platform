
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<IUser> & {
        _id: string;
        id?: string;
        institutionId?: string;
        role: 'admin' | 'institution' | 'student';
        email: string;
        name?: string;
        institution?: unknown;
        student?: unknown;
        subscription?: {
          tier: 'free' | 'Starter' | 'Growth' | 'Enterprise';
          status?: 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';
          updatedAt?: Date;
          expiresAt?: Date;
          subscriptionId?: unknown;
        };
      };
    }
  }
}

export {};
