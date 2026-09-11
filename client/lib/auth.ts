
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type AppRole = 'admin' | 'institution' | 'student';

type InstitutionStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

type AuthenticatedUser = NextAuthUser & {
  id: string;
  role: AppRole;
  accessToken: string;
  institutionId?: string;
  institutionStatus?: InstitutionStatus;
};

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: AppRole;
      avatar?: string;
      institution?: { _id: string; status: InstitutionStatus } | null;
    };
  };
};

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });

        let result: LoginResponse;
        try {
          result = (await response.json()) as LoginResponse;
        } catch {
          if (response.status === 429) {
            throw new Error('Too many login attempts. Please wait a minute and try again.');
          }
          throw new Error('Server returned an unexpected response. Please check credentials or backend status.');
        }

        if (!response.ok || !result?.data?.user) {
          throw new Error(result.message || 'Invalid credentials');
        }

        return {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          image: result.data.user.avatar,
          role: result.data.user.role,
          accessToken: result.data.token,
          institutionId: result.data.user.institution?._id,
          institutionStatus: result.data.user.institution?.status,
        } satisfies AuthenticatedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const authenticatedUser = user as AuthenticatedUser | undefined;

      if (authenticatedUser) {
        token.id = authenticatedUser.id;
        token.role = authenticatedUser.role;
        token.accessToken = authenticatedUser.accessToken;
        token.institutionId = authenticatedUser.institutionId;
        token.institutionStatus = authenticatedUser.institutionStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
        session.user.institutionId = token.institutionId;
        session.user.institutionStatus = token.institutionStatus;
        if (token.email) session.user.email = token.email as string;
      }

      return session;
    },
  },
};
