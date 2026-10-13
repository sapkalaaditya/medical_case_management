import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('medcase_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('medcase_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Validate session on initial load
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('medcase_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/me');
        if (res.data?.success && res.data?.data?.user) {
          setUser(res.data.data.user);
          localStorage.setItem('medcase_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        // Token invalid or revoked: clear session
        localStorage.removeItem('medcase_token');
        localStorage.removeItem('medcase_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.data?.success && res.data?.data) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('medcase_token', receivedToken);
        localStorage.setItem('medcase_user', JSON.stringify(receivedUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (err) {
      // Proceed even if server-side revocation returned error
      console.warn('Logout API error:', err.message);
    } finally {
      localStorage.removeItem('medcase_token');
      localStorage.removeItem('medcase_user');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
