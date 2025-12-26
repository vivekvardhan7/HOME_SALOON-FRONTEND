/**
 * Safely clears all potential authentication tokens and sessions from localStorage.
 * This is used to resolve 403 Forbidden errors caused by stale or mismatched sessions.
 */
export const clearAllAuthSessions = () => {
  try {
    // Standard tokens used in the application
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('supabase.accessToken');
    localStorage.removeItem('user');
    
    // Clear all Supabase internal storage keys
    // These typically look like pb-xxxxxxxxxxxxxxxxxxxx-auth-token
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('-auth-token') || key.includes('supabase.auth.'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('🧹 All auth sessions and tokens have been cleared.');
  } catch (error) {
    console.error('Failed to clear auth sessions:', error);
  }
};
