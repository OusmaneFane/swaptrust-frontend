import { auth } from '@/auth';
import type { UserRole } from '@/types/user';

function roleFromAuth(auth: { user?: unknown } | null): UserRole {
  const u = auth?.user as { role?: UserRole } | undefined;
  const r = u?.role;
  if (r === 'ADMIN' || r === 'OPERATOR' || r === 'CLIENT') return r;
  return 'CLIENT';
}

function isStaff(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OPERATOR';
}

const protectedPrefixes = [
  '/tableau-de-bord',
  '/mes-demandes',
  '/demandes',
  '/transactions',
  '/profil',
  '/notifications',
  '/kyc',
  '/admin',
  '/operateur',
];

/** Pages réservées aux utilisateurs avec KYC approuvé (hors admin / opérateur). */
const appClientPrefixes = [
  '/tableau-de-bord',
  '/mes-demandes',
  '/demandes',
  '/transactions',
  '/profil',
  '/notifications',
] as const;

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAppClientPath(pathname: string): boolean {
  return appClientPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isKycPath(pathname: string): boolean {
  return pathname === '/kyc' || pathname.startsWith('/kyc/');
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = roleFromAuth(req.auth);
  const kycOk = req.auth?.user?.kycStatus === 'VERIFIED';
  const staff = isStaff(role);

  if (pathname === '/ordres' || pathname === '/ordres/') {
    return Response.redirect(new URL('/mes-demandes', req.nextUrl));
  }
  if (pathname === '/ordres/creer') {
    return Response.redirect(new URL('/demandes/nouvelle', req.nextUrl));
  }
  const ordreMatch = /^\/ordres\/(\d+)/.exec(pathname);
  if (ordreMatch) {
    return Response.redirect(
      new URL(`/demandes/${ordreMatch[1]}`, req.nextUrl),
    );
  }

  if (!req.auth && isProtectedPath(pathname)) {
    const url = new URL('/connexion', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return Response.redirect(url);
  }

  if (req.auth && (pathname === '/connexion' || pathname === '/inscription')) {
    if (role === 'ADMIN') {
      return Response.redirect(new URL('/admin', req.nextUrl));
    }
    if (role === 'OPERATOR') {
      return Response.redirect(new URL('/operateur', req.nextUrl));
    }
    if (kycOk) {
      return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
    }
    return Response.redirect(new URL('/kyc', req.nextUrl));
  }

  if (req.auth && role === 'CLIENT' && pathname.startsWith('/operateur')) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  if (req.auth && role === 'CLIENT' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  if (req.auth && role === 'OPERATOR' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return Response.redirect(new URL('/operateur', req.nextUrl));
  }

  if (
    req.auth &&
    (pathname === '/operateur' || pathname.startsWith('/operateur/')) &&
    !staff
  ) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  if (req.auth && !staff && isAppClientPath(pathname) && !kycOk) {
    return Response.redirect(new URL('/kyc', req.nextUrl));
  }

  if (req.auth && !staff && isKycPath(pathname) && kycOk) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  return;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
