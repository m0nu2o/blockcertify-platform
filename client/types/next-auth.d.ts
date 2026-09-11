
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'admin' | 'institution' | 'student';
      accessToken: string;
      institutionId?: string;
      institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
    };
  }

  interface User extends DefaultUser {
    id: string;
    role: 'admin' | 'institution' | 'student';
    accessToken: string;
    institutionId?: string;
    institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'institution' | 'student';
    accessToken: string;
    institutionId?: string;
    institutionStatus?: 'pending' | 'approved' | 'suspended' | 'rejected';
  }
}
