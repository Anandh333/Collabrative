import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const storedUser = authService.getUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
          const response = await authService.getMe();
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    try {
      const response = await authService.signup(name, email, password, role);
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authService.updateProfile(data);
      setUser(response.user);
      toast.success('Profile updated successfully!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    isManager: user?.role === 'manager',
    login,
    signup,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};