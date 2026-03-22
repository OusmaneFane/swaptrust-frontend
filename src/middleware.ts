import { auth } from '@/auth';

const protectedPrefixes = [
  '/tableau-de-bord',
  '/ordres',
  '/transactions',
  '/profil',
  '/notifications',
  '/kyc',
  '/admin',
];

/** Pages réservées aux utilisateurs avec KYC approuvé (hors admin). */
const appClientPrefixes = [
  '/tableau-de-bord',
  '/ordres',
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

  if (!req.auth && isProtectedPath(pathname)) {
    const url = new URL('/connexion', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return Response.redirect(url);
  }

  if (
    req.auth &&
    (pathname === '/connexion' || pathname === '/inscription')
  ) {
    const u = req.auth.user;
    if (u?.isAdmin || u?.kycStatus === 'VERIFIED') {
      return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
    }
    return Response.redirect(new URL('/kyc', req.nextUrl));
  }

  if (
    req.auth &&
    (pathname === '/admin' || pathname.startsWith('/admin/')) &&
    !req.auth.user?.isAdmin
  ) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  const u = req.auth?.user;
  const kycOk = u?.kycStatus === 'VERIFIED';

  if (
    req.auth &&
    !u?.isAdmin &&
    isAppClientPath(pathname) &&
    !kycOk
  ) {
    return Response.redirect(new URL('/kyc', req.nextUrl));
  }

  if (req.auth && !u?.isAdmin && isKycPath(pathname) && kycOk) {
    return Response.redirect(new URL('/tableau-de-bord', req.nextUrl));
  }

  return;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
