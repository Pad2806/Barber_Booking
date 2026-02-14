import { authorize, login as zaloLogin, getAccessToken as getZaloToken, getUserInfo } from 'zmp-sdk';
import apiClient from './api';

export interface ZaloUserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: string;
  zaloId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Get Zalo access token
export const getZaloAccessToken = async (): Promise<string> => {
  try {
    const token = await getZaloToken();
    return token;
  } catch (error) {
    console.error('Failed to get Zalo token:', error);
    throw error;
  }
};

// Get Zalo user info
export const getZaloUserInfo = async (): Promise<ZaloUserInfo> => {
  try {
    const { userInfo } = await getUserInfo({});
    return {
      id: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar,
    };
  } catch (error) {
    console.error('Failed to get Zalo user info:', error);
    throw error;
  }
};

// Login with Zalo OAuth
export const loginWithZalo = async (): Promise<LoginResponse> => {
  try {
    // Request authorization from user
    await authorize({
      scopes: ['scope.userInfo'],
    });

    // Get Zalo user info first (this works even if app is not fully activated)
    const zaloUser = await getZaloUserInfo();

    // Try to get Zalo access token (may fail with -1401 if app not activated)
    let zaloToken = '';
    let zaloCode = '';

    try {
      zaloToken = await getZaloAccessToken();

      if (!zaloToken) {
        const loginResult = await zaloLogin().catch(() => '');
        if (typeof loginResult === 'string' && loginResult) {
          zaloCode = loginResult;
        }
        zaloToken = await getZaloAccessToken().catch(() => '');
      }
    } catch (tokenError: any) {
      // Log token error but continue with user info only
      console.warn('Failed to get Zalo token (app may not be activated):', tokenError);
      // If error code is -1401, it means app is not activated yet
      // We'll proceed with just user info for development/testing
    }

    // Call backend API to authenticate
    // Backend will handle the case where no token is provided (development mode)
    const response = await apiClient.post<LoginResponse>('/auth/zalo', {
      ...(zaloToken ? { accessToken: zaloToken } : {}),
      ...(zaloCode ? { code: zaloCode } : {}),
      zaloId: zaloUser.id,
      name: zaloUser.name,
      avatar: zaloUser.avatar,
    });

    return response.data;
  } catch (error) {
    console.error('Zalo login failed:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

// Update user profile
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await apiClient.put<User>('/auth/me', data);
  return response.data;
};

// Refresh tokens
export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};
