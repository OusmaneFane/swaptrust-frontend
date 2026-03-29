import type { DefaultSession } from 'next-auth';
import type { UserRole } from './user';

declare module 'next-auth' {
  interface User {
    accessToken?: string;
    role?: UserRole;
  }

  interface Session {
    accessToken?: string;
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
      kycStatus?: import('./user').User['kycStatus'];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
    role?: UserRole;
    kycStatus?: import('./user').User['kycStatus'];
  }
}
