/**
 * Admin API Client with error handling and retry logic
 */

import { getApiUrl } from '../config/env';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Make API request with strict URL handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
    signal: AbortSignal.timeout(10000), // 10 second timeout
  };

  const fullUrl = getApiUrl(endpoint);

  try {
    const response = await fetch(fullUrl, requestOptions);

    if (response.ok) {
      const data = await response.json();
      // console.log(`✅ Admin API response for ${endpoint}:`, data);

      // Check if response has success flag
      if (data.success === false) {
        return {
          success: false,
          message: data.message || data.error || 'Request failed',
          error: data.error,
        };
      }

      return {
        success: true,
        data: data,
      };
    } else {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      console.error(`❌ Admin API error for ${endpoint}:`, errorData);

      return {
        success: false,
        message: errorData.message || errorData.error || 'Request failed',
        error: errorData.error,
      };
    }
  } catch (error: any) {
    console.error(`Admin API call failed for ${endpoint}:`, error);

    return {
      success: false,
      message: error.message || 'Network error: Unable to connect to server',
      error: error.message,
    };
  }
}

/**
 * Admin API functions
 */
export const adminApi = {
  /**
   * Generic GET request
   */
  async get<T>(endpoint: string) {
    return apiRequest<T>(endpoint);
  },

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data: any) {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data: any) {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string) {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
    });
  },

  /**
   * Get admin dashboard data
   */
  async getDashboard() {
    return apiRequest<any>('/admin/dashboard');
  },

  /**
   * Get all vendors
   */
  async getAllVendors() {
    return apiRequest<{ vendors: any[] }>('/admin/vendors');
  },

  /**
   * Get all users
   */
  async getAllUsers() {
    return apiRequest<{ users: any[] }>('/admin/users');
  },

  /**
   * Get all managers
   */
  async getAllManagers() {
    return apiRequest<{ managers: any[] }>('/admin/managers');
  },

  /**
   * Update vendor status
   */
  async updateVendorStatus(vendorId: string, status: string) {
    return apiRequest<any>(`/admin/vendors/${vendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get vendor details
   */
  async getVendorDetails(vendorId: string) {
    // Return explicitly set type to avoid losing properties
    return apiRequest<{
      vendor: any;
      services: any[];
      products: any[];
      employees: any[];
    }>(`/admin/vendors/${vendorId}`);
  },

  /**
   * Get vendor services
   */
  async getVendorServices(vendorId: string) {
    return apiRequest<{ services: any[] }>(`/admin/vendors/${vendorId}/services`);
  },

  /**
   * Get vendor employees
   */
  async getVendorEmployees(vendorId: string) {
    return apiRequest<{ employees: any[] }>(`/admin/vendors/${vendorId}/employees`);
  },

  /**
   * Get vendor products
   */
  async getVendorProducts(vendorId: string) {
    return apiRequest<{ products: any[] }>(`/admin/vendors/${vendorId}/products`);
  },

  /**
   * Update service details
   */
  async updateService(serviceId: string, data: any) {
    return apiRequest<any>(`/admin/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Toggle service status
   */
  async toggleServiceStatus(serviceId: string) {
    return apiRequest<any>(`/admin/services/${serviceId}/toggle`, {
      method: 'PATCH',
    });
  },

  /**
   * Delete service
   */
  async deleteService(serviceId: string) {
    return apiRequest<any>(`/admin/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string) {
    return apiRequest<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Get all at-salon services (Admin view)
   */
  async getAtSalonServices() {
    return apiRequest<{ orders: any[], count: number }>('/admin/at-salon-services');
  },
};

export default adminApi;

