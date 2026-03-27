import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import axios from 'axios';

// Use INTERNAL_API_URL for server-to-server calls on Dokploy to bypass public DNS issues
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });

          if (response.data) {
            return {
              id: response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.name,
              image: response.data.user.avatar,
              role: response.data.user.role,
              roles: response.data.user.roles || [response.data.user.role],
              position: response.data.user.position,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            };
          }
          return null;
        } catch (error: any) {
          console.error("NextAuth Login Error:", error?.response?.data || error?.message || error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const response = await axios.post(`${API_URL}/api/auth/${account.provider}`, {
            accessToken: account.access_token,
            [`${account.provider}Id`]: account.providerAccountId,
            email: user.email,
            name: user.name,
            avatar: user.image,
          });

          if (response.data) {
            (user as any).accessToken = response.data.accessToken;
            (user as any).refreshToken = response.data.refreshToken;
            (user as any).role = response.data.user.role;
            (user as any).roles = response.data.user.roles || [response.data.user.role];
            (user as any).position = response.data.user.position;
            return true;
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roles = (user as any).roles;
        token.position = (user as any).position;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).roles = token.roles;
        (session.user as any).position = token.position;
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'reetro-barbershop-dev-secret-key-123456789',
  trustHost: true,
});
