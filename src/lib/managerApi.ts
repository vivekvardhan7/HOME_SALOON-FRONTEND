/**
 * Manager API Client with error handling and retry logic
 */

const API_BASE = '/api'; // Use Vite proxy instead of hardcoded URL
const FALLBACK_BASE = 'http://localhost:3001/api';
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

const attemptTargets = [
  { baseUrl: API_BASE, label: 'primary' },
  { baseUrl: FALLBACK_BASE, label: 'fallback' },
];

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

async function performFetch<T>(
  baseUrl: string,
  endpoint: string,
  init: RequestInit,
  label: string
): Promise<{ response: Response; parsed: ParsedBody<T> }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (init.signal) {
    const abortHandler = () => controller.abort();
    init.signal.addEventListener('abort', abortHandler, { once: true });
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...init,
      signal: controller.signal,
    });
    const parsed = await parseResponseBody<T>(response);
    return { response, parsed };
  } finally {
    clearTimeout(timeoutId);
  }
}

function createFailureResponse<T>(
  endpoint: string,
  baseUrl: string,
  response: Response | null,
  parsed: ParsedBody,
  error: unknown
): ApiResponse<T> {
  if (response) {
    const message = parsed?.data && typeof parsed.data === 'object' && 'message' in parsed.data
      ? (parsed.data as Record<string, unknown>).message as string
      : parsed.rawText || `HTTP ${response.status}: ${response.statusText}`;

    console.error(`❌ API error for ${endpoint} via ${baseUrl}:`, {
      status: response.status,
      statusText: response.statusText,
      message,
      body: parsed.rawText,
      parseError: parsed.parseError,
    });

    const failure: ApiResponse<T> = {
      success: false,
      message,
      error: parsed.parseError instanceof Error ? parsed.parseError.message : undefined,
    };

    if (parsed.data !== undefined) {
      failure.data = parsed.data as T;
    }

    return failure;
  }

  const derivedMessage = error instanceof Error ? error.message : 'Network error: Unable to connect to server';

  console.error(`❌ API request failed for ${endpoint} via ${baseUrl}:`, error);

  return {
    success: false,
    message: derivedMessage,
    error: derivedMessage,
  };
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

function shouldFallback(response: Response, parsed: ParsedBody): boolean {
  if (!response.ok && response.status >= 500) {
    return true;
  }

  if (response.ok && parsed.parseError) {
    // Try fallback if JSON parsing failed on primary
    return true;
  }

  return false;
}

/**
 * Make API request with automatic fallback and retry
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

  console.log(`📡 Making API request to: ${endpoint}`);
  console.log(`🔐 Token present: ${token ? 'Yes' : 'No'}`);
  if (token) {
    console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
  } else {
    console.warn('⚠️ No token found in localStorage. Request may fail if authentication is required.');
  }

  const { headers: optionHeaders, ...restOptions } = options;
  const headers = buildHeaders(token, optionHeaders);
  const baseRequestInit: RequestInit = {
    ...restOptions,
    headers,
  };

  let lastFailure: ApiResponse<T> | null = null;
  let lastError: unknown = null;

  for (const { baseUrl, label } of attemptTargets) {
    try {
      const { response, parsed } = await performFetch<T>(baseUrl, endpoint, baseRequestInit, label);

      if (parsed.parseError) {
        console.warn(`⚠️ Failed to parse JSON from ${label} response for ${endpoint}`, {
          parseError: parsed.parseError,
          rawText: parsed.rawText,
        });
      }

      if (response.ok) {
        if (parsed.data && typeof parsed.data === 'object' && (parsed.data as any).success === false) {
          const failure: ApiResponse<T> = {
            success: false,
            message: (parsed.data as any).message || (parsed.data as any).error || 'Request failed',
            error: (parsed.data as any).error,
          };

          if (parsed.data !== undefined) {
            failure.data = parsed.data;
          }

          console.error(`❌ API reported failure for ${endpoint} via ${label}`, failure);

          if (label === 'primary' && shouldFallback(response, parsed)) {
            lastFailure = failure;
            console.warn(`⚠️ Retrying ${endpoint} with fallback after API reported failure.`);
            continue;
          }

          return failure;
        }

        console.log(`✅ API response for ${endpoint} via ${label}:`, parsed.data ?? parsed.rawText ?? '(empty)');
        if (label === 'primary' && shouldFallback(response, parsed)) {
          console.warn(`⚠️ Retrying ${endpoint} with fallback due to parse error or server response.`);
          lastFailure = buildSuccessResponse(endpoint, parsed);
          continue;
        }

        return buildSuccessResponse<T>(endpoint, parsed);
      }

      const failureResponse = createFailureResponse<T>(endpoint, baseUrl, response, parsed, null);
      if (label === 'primary' && shouldFallback(response, parsed)) {
        lastFailure = failureResponse;
        console.warn(`⚠️ ${endpoint} returned ${response.status} via primary. Attempting fallback...`);
        continue;
      }

      return failureResponse;
    } catch (error) {
      lastError = error;
      if (label === 'primary') {
        console.warn(`⚠️ Primary API call failed for ${endpoint}, trying fallback...`, error);
        continue;
      }

      return createFailureResponse(endpoint, baseUrl, null, {} as ParsedBody<T>, error);
    }
  }

  if (lastFailure) {
    return lastFailure;
  }

  return createFailureResponse(endpoint, FALLBACK_BASE, null, {} as ParsedBody<T>, lastError);
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
