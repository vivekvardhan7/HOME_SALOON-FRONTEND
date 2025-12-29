/**
 * Manager API Client with error handling and retry logic
 */

// Use Vite proxy instead of hardcoded URL - logic moved to consolidated API_BASE below
import { getApiUrl } from '@/config/env';
const REQUEST_TIMEOUT_MS = 30000;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Check if backend server is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      return response.ok;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

interface ParsedBody<T = unknown> {
  data?: T;
  rawText?: string;
  parseError?: unknown;
}

const API_BASE = getApiUrl(''); // Used only for health check fallbacks if needed, but primary requests use getApiUrl(endpoint)

function buildHeaders(token: string | null, optionHeaders?: HeadersInit): Headers {
  const headers = new Headers(optionHeaders);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  return headers;
}

async function parseResponseBody<T = unknown>(response: Response): Promise<ParsedBody<T>> {
  try {
    const text = await response.text();

    if (!text) {
      return { data: undefined, rawText: '' };
    }

    try {
      const parsed = JSON.parse(text) as T;
      return { data: parsed, rawText: text };
    } catch (parseError) {
      return { rawText: text, parseError };
    }
  } catch (error) {
    return { parseError: error };
  }
}

function createFailureResponse<T>(
  endpoint: string,
  url: string,
  response: Response | null,
  parsed: ParsedBody,
  error: unknown
): ApiResponse<T> {
  const message = parsed?.data && typeof parsed.data === 'object' && 'message' in parsed.data
    ? (parsed.data as Record<string, unknown>).message as string
    : parsed?.rawText || (response ? `HTTP ${response.status}: ${response.statusText}` : 'Unknown Error');

  console.error(`❌ API error for ${endpoint}:`, {
    url,
    status: response?.status,
    statusText: response?.statusText,
    message,
    body: parsed?.rawText,
    parseError: parsed?.parseError,
    error
  });

  const failure: ApiResponse<T> = {
    success: false,
    message: error instanceof Error ? error.message : message,
    error: parsed?.parseError instanceof Error ? parsed.parseError.message : (error instanceof Error ? error.message : undefined),
  };

  if (parsed?.data !== undefined) {
    failure.data = parsed.data as T;
  }

  return failure;
}

function buildSuccessResponse<T>(endpoint: string, parsed: ParsedBody<T>): ApiResponse<T> {
  if (parsed.parseError) {
    console.warn(`⚠️ Received non-JSON response for ${endpoint}`, {
      parseError: parsed.parseError,
      rawText: parsed.rawText,
    });
  }

  const success: ApiResponse<T> = {
    success: true,
    message: parsed.parseError ? 'Response was not valid JSON. See rawText for details.' : undefined,
    error: parsed.parseError instanceof Error ? parsed.parseError.message : undefined,
  };

  if (parsed.data !== undefined) {
    success.data = parsed.data;
  }

  return success;
}

/**
 * Make API request with automatic fallback and retry
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  // STRICT FIX: Use getApiUrl(endpoint) directly to prevent double slashes
  const url = getApiUrl(endpoint);

  console.log(`📡 Making API request to: ${url}`);

  if (token) {
    // console.log(`🔑 Token present`);
  } else {
    console.warn('⚠️ No token found in localStorage.');
  }

  const { headers: optionHeaders, ...restOptions } = options;
  const headers = buildHeaders(token, optionHeaders);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const parsed = await parseResponseBody<T>(response);

    if (response.ok) {
      if (parsed.data && typeof parsed.data === 'object' && (parsed.data as any).success === false) {
        return createFailureResponse(endpoint, url, response, parsed, null);
      }
      return buildSuccessResponse<T>(endpoint, parsed);
    }

    return createFailureResponse(endpoint, url, response, parsed, null);

  } catch (error) {
    clearTimeout(timeoutId);
    return createFailureResponse(endpoint, url, null, {} as ParsedBody<T>, error);
  }
}

/**
 * Manager API functions - Using Backend API
 */
export const managerApi = {
  /**
   * Get manager dashboard data
   */
  async getDashboard() {
    return apiRequest<any>('/manager/dashboard');
  },

  /**
   * Get pending vendors
   */
  async getPendingVendors() {
    return apiRequest<any>('/manager/vendors/pending');
  },

  /**
   * Get all vendors (for manager dashboard)
   */
  async getAllVendors() {
    return apiRequest<any>('/manager/vendors');
  },

  /**
   * Get approved vendors
   */
  async getApprovedVendors() {
    return apiRequest<any>('/manager/vendors/approved');
  },

  /**
   * Get vendor details
   */
  async getVendorDetails(vendorId: string) {
    return apiRequest<any>(`/manager/vendors/${vendorId}/details`);
  },

  /**
   * Approve vendor - Update status to 'approved' in Supabase
   */
  async approveVendor(vendorId: string) {
    return apiRequest<any>(`/manager/vendors/${vendorId}/approve`, {
      method: 'PATCH'
    });
  },

  /**
   * Reject vendor - Update status to 'rejected' in Supabase
   */
  async rejectVendor(vendorId: string, reason?: string) {
    return apiRequest<any>(`/manager/vendors/${vendorId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Get appointments (keeping API call for now as it's not part of the 4 issues)
   */
  async getAppointments(filters?: { status?: string; serviceType?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.serviceType) queryParams.append('serviceType', filters.serviceType);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const query = queryParams.toString();
    return apiRequest<any>(`/manager/appointments${query ? `?${query}` : ''}`);
  },
};

export default managerApi;
