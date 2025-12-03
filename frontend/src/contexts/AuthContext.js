import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me', { 
        withCredentials: true 
      });
      setUser(res.data.user);
    } catch (error) {
      console.log('No auth token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', 
      { email, password }, 
      { withCredentials: true }
    );
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/signup', 
      { name, email, password }, 
      { withCredentials: true }
    );
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await axios.post('http://localhost:5000/api/auth/logout', {}, 
      { withCredentials: true }
    );
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, signup, logout, checkAuth, loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
