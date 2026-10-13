import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading while verifying token on mount

  // On mount: restore user from localStorage and verify token
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          const { data } = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(data.message || 'Registration successful.');
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    const { data } = await authAPI.login(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(data.message || 'Login successful.');
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const isAdmin = user?.role === 'admin';
  const isCreator = user?.role === 'creator';
  const isParticipant = user?.role === 'participant';

  const hasPermission = useCallback((permKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'creator') {
      return user.creatorPermissions?.[permKey] !== false;
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        refreshUser,
        isAdmin,
        isCreator,
        isParticipant,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
