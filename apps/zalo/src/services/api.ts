import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAccessToken, getRefreshToken, applyTokens, clearTokens } from '../stores/authStore';
import { API_BASE_URL } from '../config';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      // If we can't retry safely, clear session and notify UI.
      if (!originalConfig || originalConfig._retry) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:required'));
        return Promise.reject(error);
      }

      const url = String(originalConfig.url || '');
      if (url.includes('/auth/refresh') || url.includes('/auth/zalo') || url.includes('/auth/logout')) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:required'));
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:required'));
        return Promise.reject(error);
      }

      originalConfig._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        );

        const tokens = refreshResponse.data as { accessToken: string; refreshToken: string };
        applyTokens(tokens);

        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;

        return apiClient(originalConfig);
      } catch (refreshError) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:required'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Generic API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export default apiClient;
