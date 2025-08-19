import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('authToken'); // Verifica se o token existe

  // Se estiver autenticado, renderiza o componente filho (Outlet), senão, redireciona para o login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;