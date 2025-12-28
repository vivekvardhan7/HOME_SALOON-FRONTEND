import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabaseAuth, User, RegisterData, mapSupabaseAuthError, delay } from "@/lib/supabaseAuth";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/emailjs";
import { mockAuth } from "@/lib/mockAuth";
import { supabaseConfig } from "@/config/supabase";
import { getApiUrl } from "@/config/env";
import { clearAllAuthSessions } from "@/lib/clearSession";

interface VendorData {
  id: string;
  shopName: string;
  status: string;
  emailVerified?: boolean;
  rejectionReason?: string | null;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
}

interface VendorRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  shopName: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  servicesOffered?: string[];
  businessType?: string;
  yearsInBusiness?: string | number;
  numberOfEmployees?: string | number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

interface AuthContextType {
  user: User | null;
  vendor: VendorData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  handleSignup: (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => Promise<void>;
  registerVendorAccount: (payload: VendorRegistrationPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  redirectToDashboard: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshVendorData: () => Promise<void>;
}

export const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

const STATIC_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: User;
  redirect: string;
  token: string;
}> = [
    {
      email: 'admin@homebonzenga.com',
      password: 'Admin@123',
      user: {
        id: 'admin-static-id',
        email: 'admin@homebonzenga.com',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      redirect: '/admin',
      token: 'static-admin-token',
    },
  ];

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Choose auth service based on configuration
  const authService = supabaseConfig.isConfigured ? supabaseAuth : mockAuth;

  // Fetch vendor data for vendor users
  // Fetch vendor data for vendor users
  const fetchVendorData = async (userId: string) => {
    try {
      // Use the profile endpoint to get the full vendor object including the REAL vendor ID
      // backend route: /api/vendor/:userId/profile
      const response = await api.get<any>(`/vendor/${userId}/profile`);

      if (!response.data) {
        setVendor(null);
        return;
      }

      const vendorData = response.data;

      setVendor({
        id: vendorData.id, // This is the VENDOR table ID (UUID or Int), DIFFERENT from user.id
        shopName: vendorData.shopname || vendorData.shopName || '',
        status: vendorData.status,
        emailVerified: vendorData.email_verified || vendorData.emailVerified,
        rejectionReason: vendorData.rejection_reason || vendorData.rejectionReason || null,
        // Map other fields if needed for context
        address: vendorData.address,
        city: vendorData.city,
        state: vendorData.state,
        zipCode: vendorData.zip_code || vendorData.zipCode,
        description: vendorData.description
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setVendor(null);
    }
  };

  // Sync user to local database (non-blocking, fails gracefully)
  // NOTE: This is optional and only runs if the backend server is available
  // Since we're using Supabase as the primary database, this sync is disabled by default
  const syncUserToLocalDB = async (user: User) => {
    // Skip sync by default - only enable if explicitly configured
    // This prevents unnecessary connection attempts and warnings
    // Set REACT_APP_ENABLE_LOCAL_SYNC=true in .env to enable local DB sync
    const shouldSync = process.env.REACT_APP_ENABLE_LOCAL_SYNC === 'true';

    if (!shouldSync) {
      // Silently skip if sync is disabled (default behavior)
      return;
    }



    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 second timeout

      const response = await fetch(getApiUrl('auth/sync-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User synced to local database:', data.synced ? 'created' : 'already exists');
      } else {
        // Only log if it's not a connection error (those are expected)
        if (response.status !== 0) {
          console.debug('Local database sync returned status:', response.status);
        }
      }
    } catch (error) {
      // Fail silently - this is non-critical since Supabase is the primary database
      // Only log to debug level to avoid console noise
      if (process.env.NODE_ENV === 'development') {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // Connection refused - expected if backend is not running
          console.debug('Local database sync unavailable (backend server not running - this is OK if using Supabase only)');
        } else if (error.name === 'AbortError') {
          console.debug('Local database sync timed out');
        } else {
          console.debug('Local database sync error (non-critical):', error);
        }
      }
    }
  };

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // FIRST check for static manager/admin tokens BEFORE any Supabase checks
        // This ensures static tokens are preserved even if Supabase checks fail
        const storedToken = localStorage.getItem('token');
        const staticAccount = STATIC_ACCOUNTS.find(acc => acc.token === storedToken);

        if (staticAccount) {
          // Restore static account user on page reload
          console.log('🔄 Restoring static account session:', staticAccount.user.email);
          setUser(staticAccount.user);
          setVendor(null);
          setIsLoading(false);
          return; // Exit early - static account is authenticated
        }

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 10000); // 10 second timeout
        });

        // Check for valid Supabase session (for Supabase auth)
        if (supabaseConfig.isConfigured) {
          const sessionPromise = authService.getCurrentSession();
          const sessionResult = await Promise.race([sessionPromise, timeoutPromise]).catch(() => ({ success: false, data: null })) as any;

          // Check if session check failed with 403 Forbidden
          if (sessionResult?.status === 403 || sessionResult?.error === 'Forbidden') {
            console.error('🚫 Supabase session check failed with 403 Forbidden. Clearing stale session...');
            clearAllAuthSessions();
            setIsLoading(false);
            return;
          }

          if (sessionResult?.success && 'data' in sessionResult && sessionResult.data) {
            // Valid Supabase session exists, proceed with user fetch
            try {
              const accessToken = sessionResult.data?.access_token;
              if (accessToken) {
                localStorage.setItem('token', accessToken);
              }
            } catch (e) {
              // non-fatal
            }

            const userPromise = authService.getCurrentUser();
            const userResult = await Promise.race([userPromise, timeoutPromise]).catch(err => {
              console.warn('User fetch timeout or error:', err);
              return { success: true, data: null };
            }) as any;

            // Check if user fetch failed with 403 Forbidden
            if (userResult?.status === 403 || userResult?.error === 'Forbidden') {
              console.error('🚫 Supabase user fetch failed with 403 Forbidden. Clearing stale session...');
              clearAllAuthSessions();
              setIsLoading(false);
              return;
            }

            if (userResult?.success && 'data' in userResult && userResult.data) {
              const userData = userResult.data as User;
              setUser(userData);

              // If user is a vendor, fetch vendor data
              if (userData.role === 'VENDOR' && userData.id) {
                fetchVendorData(userData.id);
              }

              // Sync user to local database (don't wait for this, doesn't block login)
              syncUserToLocalDB(userData).catch(() => {
                // Error already logged in syncUserToLocalDB
              });

              setIsLoading(false);
              return; // Exit early if we have valid session
            }
          }
        }

        // If no valid Supabase session and no static token, check localStorage for mock auth or backend login
        // But only if we're using mock auth or if there's no Supabase configured
        if (!supabaseConfig.isConfigured) {
          const storedUser = localStorage.getItem('user');
          const storedAccessToken = localStorage.getItem('accessToken') || storedToken;

          if (storedUser && storedAccessToken) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsLoading(false);

              // If user is a vendor, fetch vendor data
              if (userData.role === 'VENDOR' && userData.id) {
                fetchVendorData(userData.id).catch(() => { });
              }
              return; // Exit early if we have user from localStorage (mock auth only)
            } catch (e) {
              console.warn('Failed to parse stored user data:', e);
              localStorage.removeItem('user');
            }
          }
        } else {
          // Supabase is configured but no valid session found
          // Only clear Supabase-specific items, preserve static tokens
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // DO NOT remove 'token' - it may be a static manager/admin token
        }
      } catch (error) {
        console.warn('Error getting initial session (non-critical):', error);

        // Before clearing token, check if it's a static token
        const storedToken = localStorage.getItem('token');
        const staticAccount = STATIC_ACCOUNTS.find(acc => acc.token === storedToken);

        if (staticAccount) {
          // Preserve static account even on error
          console.log('🔄 Preserving static account session after error:', staticAccount.user.email);
          setUser(staticAccount.user);
          setVendor(null);
          setIsLoading(false);
          return;
        }

        // Clear user state on error (only if not a static token)
        setUser(null);
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch { }
      } finally {
        // Always clear loading state
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes with error handling (only for Supabase)
    let subscription: any = null;
    if (supabaseConfig.isConfigured) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Reduce noisy logs and avoid printing sensitive tokens
          if (import.meta.env.DEV) {
            console.log('Auth state changed:', event);
          }

          try {
            if (event === 'SIGNED_IN' && session) {
              // store token for backend API
              try { localStorage.setItem('token', session.access_token); } catch { }
              try {
                const userResult = await authService.getCurrentUser();
                if (userResult.success && 'data' in userResult && userResult.data) {
                  setUser(userResult.data);

                  // If user is a vendor, fetch vendor data
                  if (userResult.data.role === 'VENDOR' && userResult.data.id) {
                    fetchVendorData(userResult.data.id);
                  }

                  // Sync user to local database on sign in (don't wait)
                  syncUserToLocalDB(userResult.data).catch(() => {
                    // Error already logged in syncUserToLocalDB
                  });
                }
              } catch (fetchError) {
                console.warn('Failed to fetch user on sign in:', fetchError);
                // Don't block sign in, but log the error
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setVendor(null);
              try { localStorage.removeItem('token'); } catch { }
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Optionally refresh user data when token is refreshed
              try { localStorage.setItem('token', session.access_token); } catch { }
              try {
                const userResult = await authService.getCurrentUser();
                if (userResult.success && 'data' in userResult && userResult.data) {
                  setUser(userResult.data);
                }
              } catch (fetchError) {
                console.warn('Failed to refresh user data:', fetchError);
                // Don't block token refresh, just log
              }
            }
          } catch (error) {
            console.warn('Error handling auth state change:', error);
            // On error, clear user state to prevent stuck loading
            if (event === 'SIGNED_OUT' || !session) {
              setUser(null);
            }
          } finally {
            // Always clear loading state
            setIsLoading(false);
          }
        }
      );
      subscription = sub;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Validate and trim inputs
      const trimmedEmail = (email || '').trim();
      const trimmedPassword = (password || '').trim();

      if (!trimmedEmail) throw new Error('Email is required');
      if (!trimmedPassword || trimmedPassword.length < 6) throw new Error('Password must be at least 6 characters long');

      // Check Static Accounts first
      const staticAccount = STATIC_ACCOUNTS.find(
        account =>
          account.email.toLowerCase() === trimmedEmail.toLowerCase() &&
          account.password === trimmedPassword
      );

      if (staticAccount) {
        setUser(staticAccount.user);
        setVendor(null);
        try { localStorage.removeItem('supabase.accessToken'); } catch { }
        try { localStorage.setItem('token', staticAccount.token); } catch { }
        toast.success('Login successful');
        navigate(staticAccount.redirect, { replace: true });
        return;
      }

      // Backend API Login
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in.');
      }

      const { user: apiUser, accessToken, refreshToken, vendor: vendorProfile, redirectPath } = data;

      if (accessToken) {
        localStorage.setItem('token', accessToken);
        // localStorage.setItem('refreshToken', refreshToken); // Optional if needed
      }

      // Map API user to User interface if needed (Assuming backend returns compatible shape or mapping it here)
      const appUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        firstName: apiUser.first_name || apiUser.firstName,
        lastName: apiUser.last_name || apiUser.lastName,
        role: apiUser.role,
        status: apiUser.status || 'ACTIVE',
        phone: apiUser.phone
      };

      setUser(appUser);

      if (apiUser.role === 'VENDOR' && vendorProfile) {
        setVendor({
          id: vendorProfile.id,
          shopName: vendorProfile.shopName || vendorProfile.shopname || '',
          status: vendorProfile.status,
          emailVerified: vendorProfile.emailVerified || vendorProfile.email_verified,
          rejectionReason: vendorProfile.rejectionReason || vendorProfile.rejection_reason,
          address: vendorProfile.address,
          city: vendorProfile.city,
          state: vendorProfile.state,
          zipCode: vendorProfile.zipCode || vendorProfile.zip_code,
          description: vendorProfile.description
        });
      } else {
        setVendor(null);
      }

      toast.success('Login successful');

      // Use redirect path from backend if available, or fallback
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        navigate(getDashboardPath(apiUser.role), { replace: true });
      }

    } catch (error: any) {
      const message = error?.message || 'Unable to sign in.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signInWithGoogle();

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Google login failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Google OAuth will redirect to the callback URL
      // The actual login handling will be done in the callback
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signUp(data);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Registration failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if email confirmation is required
      if ('data' in result && result.data) {
        if (result.data.session) {
          setUser(result.data.user);
          toast.success("Registration successful");
          const dashboardPath = getDashboardPath(result.data.user.role);
          navigate(dashboardPath);
        } else {
          toast.success("Registration successful! Please check your email to confirm your account.");
          navigate('/login');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        const result = await supabaseAuth.signInWithGoogle();
        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Google signup failed";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
        toast.success("Redirecting to Google...");
      } else {
        // Handle email/password signup via Supabase Auth
        if (!email || !password || !userData) {
          throw new Error("Email, password, and user data are required for email signup");
        }
        const result = await supabase.auth.signUp({
          email: userData.email,
          password: password,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone: userData.phone,
              role: 'CUSTOMER',
              status: 'PENDING_VERIFICATION'
            },
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // 2. DEBUG LOGS FOR USER
        console.log("✅ AUTH SIGNUP SUCCESSFUL - AUTH USER CREATED");
        console.log("👤 Auth User ID:", result.data.user?.id);
        console.log("🛠 Metadata Triggering DB Insert:", result.data.user?.user_metadata);

        // 3. HANDLE REDIRECT (DB Trigger handles the Insert)
        if (result.data.user && !result.data.session) {
          toast.success("Registration successful! Please check your inbox to confirm your account.");
          navigate('/login');
        } else if (result.data.session) {
          setUser(result.data.user as any);
          toast.success("Registration successful");
          const dashboardPath = getDashboardPath(result.data.user?.user_metadata?.role || 'CUSTOMER');
          navigate(dashboardPath);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerVendorAccount = async (payload: VendorRegistrationPayload) => {
    setIsLoading(true);
    try {
      if (!supabaseConfig.isConfigured) {
        throw new Error('Supabase is not configured. Please contact support.');
      }

      // Validate inputs
      const trimmedEmail = (payload.email || '').trim();
      const trimmedPassword = (payload.password || '').trim();

      if (!trimmedEmail) throw new Error('Email is required');
      if (!trimmedPassword || trimmedPassword.length < 6) throw new Error('Password must be at least 6 characters');
      if (!payload.shopName) throw new Error('Shop name is required');

      const { firstName, lastName, phone } = payload;

      // 1. SIMPLE AUTH SIGNUP
      // We pass all vendor details in metadata so the DB trigger can create the public.vendor record safely
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            // User Profile
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: 'VENDOR',
            status: 'PENDING_VERIFICATION',

            // Vendor Profile (Trigger uses these)
            shop_name: payload.shopName.trim(),
            description: payload.description?.trim(),
            address: payload.address?.trim(),
            city: payload.city?.trim(),
            state: payload.state?.trim(),
            zip_code: payload.zipCode?.trim(),
            latitude: payload.latitude,
            longitude: payload.longitude
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        throw new Error(mapSupabaseAuthError(error));
      }

      // 2. DEBUG LOGS
      console.log('✅ VENDOR SIGNUP SUCCESSFUL');
      console.log('👤 Auth User ID:', data.user?.id);
      console.log('🛠 Metadata for Trigger:', data.user?.user_metadata);

      // 3. HANDLE REDIRECT
      if (data.user && !data.session) {
        toast.success("Vendor application submitted! Please verify your email to continue.");
        navigate('/vendor/pending-approval');
      } else if (data.session) {
        // This usually won't happen if email verification is enabled
        toast.success("Vendor registration successful");
        navigate('/vendor/dashboard');
      }

    } catch (err: any) {
      console.error('Vendor signup error:', err);
      toast.error(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };



  const logout = async () => {
    setIsLoading(true);
    try {
      // First, sign out from Supabase to clear session and cookies
      if (supabaseConfig.isConfigured) {
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (supabaseError) {
          console.warn('Supabase signOut error (non-critical):', supabaseError);
          // Continue with logout even if Supabase signOut fails
        }
      }

      // Also call the auth service signOut for mock auth fallback
      try {
        await authService.signOut();
      } catch (authError) {
        console.warn('Auth service signOut error (non-critical):', authError);
        // Continue with logout even if auth service signOut fails
      }

      // Clear all auth-related data from localStorage
      // Remove all possible auth-related keys
      const authKeys = ['user', 'accessToken', 'refreshToken', 'token', 'mock-user', 'mock-session'];
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors when removing items
        }
      });

      // Clear all sessionStorage items (Supabase may store session data here)
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors
      }

      // Clear state
      setUser(null);
      setVendor(null);

      // Show success message
      toast.success("Logged out successfully");

      // Force a full page reload to ensure all state, cookies, and cached data is cleared
      // This is the most reliable way to ensure complete logout
      // Small delay to allow toast to display
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } catch (err: any) {
      console.error('Logout error:', err);
      // Clear everything even if logout fails
      setUser(null);
      setVendor(null);

      const authKeys = ['user', 'accessToken', 'refreshToken', 'token', 'mock-user', 'mock-session'];
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });

      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors
      }

      // Show error message but still logout
      toast.error("Logout completed with warnings");

      // Force reload even on error to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } finally {
      // Note: setIsLoading won't execute after window.location.href, but that's fine
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      // First check localStorage for user data (from backend login)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return;
        } catch (e) {
          console.warn('Failed to parse stored user:', e);
        }
      }

      // Fallback to Supabase auth service
      const userResult = await authService.getCurrentUser();
      if (userResult.success && 'data' in userResult && userResult.data) {
        setUser(userResult.data);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Refresh token error:', err);
      // Don't clear user if stored in localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
      }
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setIsLoading(true);
    try {
      const result = await supabaseAuth.updateProfile(user.id, updates);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Profile update failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ('data' in result && result.data) {
        setUser(result.data);
        toast.success("Profile updated successfully");
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.resetPassword(email);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Password reset failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (userRole?: string) => {
    // Normalize role to uppercase to handle case variations
    const role = (userRole || user?.role || '').toUpperCase();
    if (!role) return '/';

    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'VENDOR':
        return '/vendor';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const redirectToDashboard = () => {
    const dashboardPath = getDashboardPath();
    navigate(dashboardPath);
  };

  const refreshVendorData = useCallback(async () => {
    if (user?.role === 'VENDOR' && user?.id) {
      await fetchVendorData(user.id);
    } else {
      setVendor(null);
    }
  }, [user?.role, user?.id]);

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        vendor,
        isLoading,
        login,
        loginWithGoogle,
        register,
        handleSignup,
        registerVendorAccount,
        logout,
        refreshToken,
        redirectToDashboard,
        updateProfile,
        resetPassword,
        refreshVendorData,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): AuthContextType => {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    // During SSR or initial render, context might not be available yet
    // Return a safe default instead of throwing to prevent app crashes
    // Only log in development mode and only once to avoid console spam
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const hasWarned = (window as any).__supabaseAuthWarned;
      if (!hasWarned) {
        console.debug("useSupabaseAuth: Context not available yet (likely during initial render), using default values");
        (window as any).__supabaseAuthWarned = true;
      }
    }
    return {
      user: null,
      vendor: null,
      isLoading: true,
      login: async () => { throw new Error("Auth provider not available"); },
      loginWithGoogle: async () => { throw new Error("Auth provider not available"); },
      register: async () => { throw new Error("Auth provider not available"); },
      handleSignup: async () => { throw new Error("Auth provider not available"); },
      registerVendorAccount: async () => { throw new Error("Auth provider not available"); },
      logout: async () => { throw new Error("Auth provider not available"); },
      refreshToken: async () => { throw new Error("Auth provider not available"); },
      redirectToDashboard: () => { },
      updateProfile: async () => { throw new Error("Auth provider not available"); },
      resetPassword: async () => { throw new Error("Auth provider not available"); },
      refreshVendorData: async () => { },
    };
  }
  return ctx;
};
