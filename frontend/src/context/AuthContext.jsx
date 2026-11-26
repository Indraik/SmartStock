import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { login as loginRequest, register as registerRequest } from '../services/authService';
import { getCurrentUser } from '../services/userService';
import { CART_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../utils/constants';

const AuthContext = createContext(null);

/**
 * AuthProvider manages JWT persistence in localStorage and restores
 * authoritative user details and role from GET /api/users/me.
 *
 * Security note (educational trade-off): Storing JWTs in localStorage
 * is simple for a student SPA, though vulnerable to XSS compared to
 * HttpOnly cookies. We never store passwords and always re-validate
 * the session against /api/users/me on refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Remove any legacy un-scoped cart key if present
    localStorage.removeItem(CART_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser.enabled) {
        clearAuth();
        toast.error('Your account has been disabled.');
      } else {
        setToken(storedToken);
        setUser(currentUser);
      }
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    let handlingUnauthorized = false;

    const handleUnauthorized = () => {
      if (handlingUnauthorized) return;
      handlingUnauthorized = true;
      clearAuth();
      toast.error('Session expired or invalid. Please sign in again.');
      setTimeout(() => {
        handlingUnauthorized = false;
      }, 1500);
    };

    window.addEventListener('smartstock:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('smartstock:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      const fallbackUser = {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        enabled: true,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const register = async (payload) => {
    return registerRequest(payload);
  };

  const logout = useCallback(() => {
    clearAuth();
    toast.success('Signed out successfully.');
  }, [clearAuth]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser: restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
