import Axios from "axios";
import { config } from "@/config/env";

const normalizeBaseUrl = (url?: string) => (url ? url.replace(/\/+$/, "") : "");
const baseURL = normalizeBaseUrl(config.apiUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const axios = Axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically (use the correct key)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // <— fixed

  if (supabaseAnonKey) {
    config.headers = config.headers ?? {};
    config.headers["apikey"] = supabaseAnonKey;
  }

  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    config.headers.Authorization = `Bearer ${token}`;
  } else if (supabaseAnonKey) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${supabaseAnonKey}`;
  }
  return config;
});

// Optional: normalize API errors
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default axios;
