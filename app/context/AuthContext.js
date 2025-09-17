"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag to true to prevent hydration mismatch
    setIsClient(true);
    
    // Initialize user from localStorage only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasFullAccess = () => {
    // Only admin users have full access
    return user && user.userType === 'admin';
  };

  const canAccess = (resource) => {
    if (!user) return false;

    // Admin users can access everything
    if (user.userType === 'admin') {
      return true;
    }

    // OM Staff users have limited access
    if (user.userType === 'staff') {
      const staffAllowedResources = [
        'dashboard',
        'incidents', 
        'reports',
        'assignedreports',
        'assigned_reports'
      ];
      return staffAllowedResources.includes(resource.toLowerCase());
    }

    return false;
  };

  const isAdmin = () => {
    return user && user.userType === 'admin';
  };

  const isOMStaff = () => {
    return user && user.userType === 'staff';
  };

  const isBasicOMUser = () => {
    return user && user.role === 'BASIC_OM';
  };

  const value = {
    user,
    loading,
    isClient,
    login,
    logout,
    hasRole,
    hasFullAccess,
    canAccess,
    isAdmin,
    isOMStaff,
    isBasicOMUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}