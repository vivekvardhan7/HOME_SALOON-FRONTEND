import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { supabase } from './supabase';
import { config, getApiUrl } from '@/config/env';

const BASE_URL = getApiUrl('');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!BASE_URL && import.meta.env.DEV) {
  console.warn('[api] API base URL is not configured. Set VITE_API_URL.');
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL || undefined,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // ============================
    // Request Interceptor
    // ============================
    this.client.interceptors.request.use(
      async (config) => {
        // ❌ NEVER send Supabase apikey to backend APIs
        if (config.headers?.apikey) {
          delete config.headers.apikey;
        }

        // Try Supabase session first
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        } else {
          // Fallback to custom backend auth token (check both common keys)
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // ============================
    // Response Interceptor
    // ============================
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data;

              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async get<T = unknown>(
    url: string,
    config?: import('axios').AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: import('axios').AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: import('axios').AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: import('axios').AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(
    url: string,
    config?: import('axios').AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
