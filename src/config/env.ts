// Environment configuration
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://home-saloon-backend.onrender.com/api";

// Robustly handling URL construction to ALWAYS end with /api
let baseUrl = RAW_BASE_URL.replace(/\/$/, ""); // Remove trailing slash
if (!baseUrl.endsWith('/api')) {
  baseUrl += '/api';
}
const API_BASE_URL = baseUrl;

export const config = {
  apiUrl: API_BASE_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper function to get full API URL
export function getApiUrl(path = '') {
  if (!API_BASE_URL) {
    if (import.meta.env.DEV) return `http://localhost:3001/api/${path.replace(/^\//, '')}`;
    throw new Error('VITE_API_BASE_URL is missing');
  }

  // If path starts with /, remove it to avoid double slash since API_BASE_URL might end in /api (no slash) 
  // but we want standard behavior. 
  // User Requirements: `fetch(${API_BASE_URL}/manager/dashboard)` -> .../api/manager/dashboard

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

// Helper function to check if we're in development
export const isDev = () => config.isDevelopment;

// Helper function to check if we're in production
export const isProd = () => config.isProduction;
