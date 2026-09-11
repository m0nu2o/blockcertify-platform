
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

type Role = 'admin' | 'institution' | 'student';

const getRequiredRole = (pathname: string): Role | null => {
  if (pathname.startsWith('/dashboard/admin')) return 'admin';
  if (pathname.startsWith('/dashboard/institution')) return 'institution';
  if (pathname.startsWith('/dashboard/student')) return 'student';
  return null;
};

const isAuthorizedForRoute = (userRole: Role | undefined, requiredRole: Role) => {
  if (!userRole) return false;
  if (requiredRole === 'admin') return userRole === 'admin';
  if (requiredRole === 'institution') return userRole === 'institution' || userRole === 'admin';
  return userRole === 'student' || userRole === 'admin';
};

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const requiredRole = getRequiredRole(req.nextUrl.pathname);

    if (!requiredRole) {
      return NextResponse.next();
    }

    const userRole = req.nextauth.token?.role as Role | undefined;
    if (isAuthorizedForRoute(userRole, requiredRole)) {
      return NextResponse.next();
    }

    const redirectUrl = new URL('/dashboard', req.url);
    redirectUrl.searchParams.set('accessDenied', requiredRole);
    return NextResponse.redirect(redirectUrl);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = { matcher: ['/dashboard/:path*'] };
