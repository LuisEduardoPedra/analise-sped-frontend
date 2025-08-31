import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Verifica se o token expirou
        if (decodedUser.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decodedUser);
        }
      } catch (error) {
        console.error("Token inválido:", error);
        logout();
      }
    }
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/login', { username, password });
    const { token } = response.data;
    if (token) {
      localStorage.setItem('authToken', token);
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      navigate('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/');
  };

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (permission) => {
    return user?.roles?.includes(permission) ?? false;
  };

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação
export const useAuth = () => {
  return useContext(AuthContext);
};