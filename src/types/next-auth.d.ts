import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: DefaultSession['user'] & {
      id: string;
      isAdmin?: boolean;
      kycStatus?: import('./user').User['kycStatus'];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
    isAdmin?: boolean;
    kycStatus?: import('./user').User['kycStatus'];
  }
}
