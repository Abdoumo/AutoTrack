import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Only restore session if explicitly saved and token exists; otherwise user is strictly null
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auratrack_user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch {
      // ignore
    }
    return null; // Not logged in by default
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('auratrack_user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('auratrack_user');
      localStorage.removeItem('token');
    }
  }, [user, token]);

  const login = (userData, authToken = 'session-token') => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auratrack_user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auratrack_user');
    localStorage.removeItem('token');
  };

  const toggleRole = () => {
    setUser((prev) => {
      if (!prev) return null;
      const nextRole = prev.role === 'admin' ? 'user' : 'admin';
      const updated = {
        ...prev,
        role: nextRole,
        name: nextRole === 'admin' ? 'Super Admin' : 'Regular User',
        email: nextRole === 'admin' ? 'bedoushop@gmail.com' : 'user@example.com',
      };
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      toggleRole,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
