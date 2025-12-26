// Environment configuration
const normalizeUrl = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const supabaseUrl = normalizeUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseRestUrl = supabaseUrl ? `${supabaseUrl}/rest/v1` : '';
const explicitApiUrl = normalizeUrl(import.meta.env.VITE_API_URL);
const resolvedApiUrl = explicitApiUrl || supabaseRestUrl;

export const config = {
  apiUrl: resolvedApiUrl,
  supabaseUrl,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  if (!config.apiUrl) {
    return endpoint;
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiUrl}${path}`;
};

// Helper function to check if we're in development
export const isDev = () => config.isDevelopment;

// Helper function to check if we're in production
export const isProd = () => config.isProduction;
