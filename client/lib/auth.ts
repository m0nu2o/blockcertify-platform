
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL =
  typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? 'https://blockcertify-api.onrender.com/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'https://blockcertify-api.onrender.com/api');

type AppRole = 'admin' | 'institution' | 'student';

type InstitutionStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

type AuthenticatedUser = NextAuthUser & {
  id: string;
  role: AppRole;
  accessToken: string;
  institutionId?: string;
  institutionStatus?: InstitutionStatus;
  subscriptionTier?: 'free' | 'Starter' | 'Growth' | 'Enterprise';
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
      subscription?: { tier: 'free' | 'Starter' | 'Growth' | 'Enterprise' } | null;
    };
  };
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-nextauth-secret-change-in-prod' : undefined),
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
          });
        } catch (err) {
          clearTimeout(timeoutId);
          if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('Authentication server timed out. Please try again.');
          }
          throw new Error('Unable to reach authentication server. Please try again later.');
        } finally {
          clearTimeout(timeoutId);
        }

        const rawText = await response.text();
        let parsed: Partial<LoginResponse> & { message?: string } = {};
        try {
          parsed = rawText ? JSON.parse(rawText) : {};
        } catch {
          parsed = {};
        }

        if (!response.ok) {
          throw new Error(parsed?.message || 'Invalid email or password');
        }

        if (!parsed?.data?.user || !parsed?.data?.token) {
          throw new Error('Invalid authentication response from server');
        }

        const result = parsed as LoginResponse;
        return {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          image: result.data.user.avatar,
          role: result.data.user.role,
          accessToken: result.data.token,
          institutionId: result.data.user.institution?._id,
          institutionStatus: result.data.user.institution?.status || (result.data.user.role === 'institution' ? 'pending' : undefined),
          subscriptionTier: result.data.user.subscription?.tier || 'free',
        } satisfies AuthenticatedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const authenticatedUser = user as AuthenticatedUser | undefined;

      if (authenticatedUser) {
        token.id = authenticatedUser.id;
        token.role = authenticatedUser.role;
        token.accessToken = authenticatedUser.accessToken;
        token.institutionId = authenticatedUser.institutionId;
        token.institutionStatus = authenticatedUser.institutionStatus;
        token.subscriptionTier = authenticatedUser.subscriptionTier;
      }

      if (trigger === 'update' && session) {
        if (session.subscriptionTier) {
          token.subscriptionTier = session.subscriptionTier;
        }
        if (session.institutionStatus) {
          token.institutionStatus = session.institutionStatus;
        }
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
        session.user.subscriptionTier = token.subscriptionTier;
        if (token.email) session.user.email = token.email as string;
      }

      return session;
    },
  },
};
