
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'admin' | 'institution' | 'student';
      accessToken: string;
      institutionId?: string;
      institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
      subscriptionTier?: 'free' | 'Starter' | 'Growth' | 'Enterprise';
    };
  }

  interface User extends DefaultUser {
    id: string;
    role: 'admin' | 'institution' | 'student';
    accessToken: string;
    institutionId?: string;
    institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
    subscriptionTier?: 'free' | 'Starter' | 'Growth' | 'Enterprise';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'institution' | 'student';
    accessToken: string;
    institutionId?: string;
    institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
    subscriptionTier?: 'free' | 'Starter' | 'Growth' | 'Enterprise';
  }
}
