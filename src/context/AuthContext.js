import React, { createContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize from localStorage on component mount
  useEffect(() => {
    const adminData = localStorage.getItem('adminData');
    
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData));
        setIsAuthenticated(true);
      } catch (e) {
        setAdmin(null);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const login = useCallback((adminData, token) => {
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      const { authService } = await import('../services/api');
      await authService.logout().catch(() => {
        // Continue logout even if API call fails
      });
    } catch (err) {
      // Continue logout even if import fails
    }
    localStorage.removeItem('adminData');
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        setAdmin,
        login,
        logout,
        loading,
        setLoading,
        error,
        setError,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
