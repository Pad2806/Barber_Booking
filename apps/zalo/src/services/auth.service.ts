import { authorize, getAccessToken as getZaloToken, getUserInfo } from 'zmp-sdk';
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
  user: User;
  tokens: AuthTokens;
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

    // Get Zalo access token
    const zaloToken = await getZaloAccessToken();
    
    // Get user info
    const zaloUser = await getZaloUserInfo();

    // Call backend API to authenticate
    const response = await apiClient.post<LoginResponse>('/auth/zalo', {
      accessToken: zaloToken,
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
