import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pm_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) {
          parsed.role = parsed.role.toUpperCase();
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('pm_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          const fetchedUser = res.user;
          if (fetchedUser && fetchedUser.role) {
            fetchedUser.role = fetchedUser.role.toUpperCase();
          }
          setUser(fetchedUser);
          localStorage.setItem('pm_user', JSON.stringify(fetchedUser));
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('pm_token');
          localStorage.removeItem('pm_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    const loggedUser = data.user;
    if (loggedUser && loggedUser.role) {
      loggedUser.role = loggedUser.role.toUpperCase();
    }
    localStorage.setItem('pm_token', data.token);
    localStorage.setItem('pm_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setUser(null);
  };

  const roleUpper = (user?.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN';
  const isEngineer = roleUpper === 'ENGINEER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isEngineer,
        role: roleUpper,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
