import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      role: string;
      roles: string[];
      position?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    roles: string[];
    position?: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    roles: string[];
    position?: string;
    accessToken: string;
    refreshToken: string;
  }
}
