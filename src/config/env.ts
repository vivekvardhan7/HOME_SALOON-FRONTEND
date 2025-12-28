// Environment configuration
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
// Remove trailing /api and trailing slashes to get the clean host
const API_BASE_URL = RAW_BASE_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const config = {
  apiUrl: API_BASE_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper function to get full API URL
export function getApiUrl(path = '') {
  if (!API_BASE_URL) {
    console.error('VITE_API_BASE_URL (or VITE_API_URL) is missing in environment variables');
    // Minimal fallback to prevent crash in strict dev environments, but user should fix env
    if (import.meta.env.DEV) return `http://localhost:3001/api/${path.replace(/^\//, '')}`;
    throw new Error('VITE_API_BASE_URL is missing');
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/api${cleanPath}`;
}

// Helper function to check if we're in development
export const isDev = () => config.isDevelopment;

// Helper function to check if we're in production
export const isProd = () => config.isProduction;
