import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { login } from '@/services/authService';
import { fetchAuthMeKycStatus } from '@/lib/auth-me-server';
import type { User } from '@/types/user';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const tokens = await login({
          email: String(credentials.email),
          password: String(credentials.password),
        });
        if (!tokens?.accessToken || !tokens.user?.id) return null;
        return {
          id: tokens.user.id,
          email: tokens.user.email || String(credentials.email),
          name: tokens.user.name || tokens.user.email || 'Utilisateur',
          accessToken: tokens.accessToken,
          isAdmin: tokens.user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user && 'accessToken' in user && user.accessToken) {
        const accessToken = user.accessToken as string;
        token.accessToken = accessToken;
        token.id = user.id;
        if ('isAdmin' in user && typeof user.isAdmin === 'boolean') {
          token.isAdmin = user.isAdmin;
        }
        const fromApi = await fetchAuthMeKycStatus(accessToken);
        token.kycStatus = fromApi ?? 'NOT_SUBMITTED';
      }
      if (trigger === 'update' && session && typeof session === 'object') {
        const s = session as Record<string, unknown>;
        let ks: unknown = s.kycStatus;
        if (
          ks !== 'NOT_SUBMITTED' &&
          ks !== 'PENDING' &&
          ks !== 'VERIFIED' &&
          ks !== 'REJECTED' &&
          s.user &&
          typeof s.user === 'object'
        ) {
          ks = (s.user as Record<string, unknown>).kycStatus;
        }
        if (
          ks === 'NOT_SUBMITTED' ||
          ks === 'PENDING' ||
          ks === 'VERIFIED' ||
          ks === 'REJECTED'
        ) {
          token.kycStatus = ks as User['kycStatus'];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (typeof token.id === 'string' ? token.id : undefined) ??
          session.user.email ??
          '';
        session.accessToken =
          typeof token.accessToken === 'string' ? token.accessToken : undefined;
        session.user.isAdmin = Boolean(token.isAdmin);
        if (
          token.kycStatus === 'NOT_SUBMITTED' ||
          token.kycStatus === 'PENDING' ||
          token.kycStatus === 'VERIFIED' ||
          token.kycStatus === 'REJECTED'
        ) {
          session.user.kycStatus = token.kycStatus;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/connexion',
  },
});
