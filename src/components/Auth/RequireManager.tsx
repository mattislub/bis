import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireManager: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'manager') {
    return <Navigate to="/app" replace />;
  }
  return children;
};

export default RequireManager;
