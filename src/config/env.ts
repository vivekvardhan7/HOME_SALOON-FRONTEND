// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const config = {
  apiUrl: API_BASE_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  if (!config.apiUrl) {
    if (config.isDevelopment) console.warn('VITE_API_BASE_URL is not set!');
    return endpoint;
  }

  // Normalize base URL to remove trailing slash
  const base = config.apiUrl.replace(/\/$/, '');

  // Normalize endpoint to remove leading slash
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Construct full URL with /api prefix
  return `${base}/api/${path}`;
};

// Helper function to check if we're in development
export const isDev = () => config.isDevelopment;

// Helper function to check if we're in production
export const isProd = () => config.isProduction;
