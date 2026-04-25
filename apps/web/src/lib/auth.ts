import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Use INTERNAL_API_URL for server-to-server calls on Dokploy to bypass public DNS issues
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Check if a JWT access token is expired or about to expire (within 5 min buffer).
 * Returns true if the token should be refreshed.
 */
function shouldRefreshToken(accessToken: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const BUFFER_SECONDS = 5 * 60; // refresh 5 minutes before expiry
    return decoded.exp - now < BUFFER_SECONDS;
  } catch {
    return true; // can't decode → treat as expired
  }
}

/**
 * Call backend to refresh the access token using the refresh token.
 */
async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
  return response.data; // { accessToken, refreshToken, user }
}

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
          const message: string = error?.response?.data?.message || error?.message || '';
          console.error("NextAuth Login Error:", message);
          // Distinguish blocked account from wrong credentials
          if (
            error?.response?.status === 401 &&
            (
              message.toLowerCase().includes('deactivated') ||
              message.toLowerCase().includes('blocked') ||
              message.toLowerCase().includes('khóa') ||
              message.toLowerCase().includes('khoa')
            )
          ) {
            throw new Error('ACCOUNT_BLOCKED');
          }
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in — store user data
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roles = (user as any).roles;
        token.position = (user as any).position;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.error = undefined;
        return token;
      }

      // Client called update() — roles may have changed
      if (trigger === 'update') {
        const updateData = session as any;
        // Update basic info
        if (updateData?.name) token.name = updateData.name;
        if (updateData?.image) token.picture = updateData.image;

        // Update roles/position
        if (updateData?.roles || updateData?.role) {
          if (updateData.roles) token.roles = updateData.roles;
          if (updateData.role) token.role = updateData.role;
          if (updateData.position !== undefined) token.position = updateData.position;
        } else if (token.accessToken) {
          // Fallback: try fetching from backend if payload wasn't provided
          try {
            const meResponse = await axios.get(`${API_URL}/api/users/me`, {
              headers: { Authorization: `Bearer ${token.accessToken}` },
            });
            const me = meResponse.data;
            if (me?.roles?.length) {
              token.roles = me.roles;
              token.role = me.role || token.role;
            }
            if (me?.staff?.position !== undefined) {
              token.position = me.staff.position;
            }
            // Auto-sync image and name if backend has updated data
            if (me?.avatar) token.picture = me.avatar;
            if (me?.name) token.name = me.name;
          } catch {
            // Keep existing on failure
          }
        }
        return token;
      }

      // Subsequent calls — check if accessToken needs refresh
      if (token.accessToken && !shouldRefreshToken(token.accessToken as string)) {
        // Token still valid, return as-is
        return token;
      }

      // Token expired or about to expire — try to refresh
      if (token.refreshToken) {
        try {
          const refreshed = await refreshAccessToken(token.refreshToken as string);
          token.accessToken = refreshed.accessToken;
          token.refreshToken = refreshed.refreshToken;
          // Sync roles/role/position from backend (UserRole table is source of truth)
          // Without this, roles stay stale from initial login → multi-role users
          // get denied access to pages for roles added after login.
          if (refreshed.user) {
            token.roles = refreshed.user.roles || token.roles;
            token.role = refreshed.user.role || token.role;
            token.position = refreshed.user.position ?? token.position;
          }
          token.error = undefined;
          return token;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Refresh token also expired — signal frontend to logout
          token.error = 'RefreshTokenExpired';
          return token;
        }
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
      // Propagate token error to client so it can auto-logout
      (session as any).error = token.error;
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

