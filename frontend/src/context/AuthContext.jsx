import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/user/getuser`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
      setIsAuthorized(true);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/user/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthorized(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/user/register`, userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthorized(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${API_URL}/api/user/logout`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setIsAuthorized(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthorized, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
