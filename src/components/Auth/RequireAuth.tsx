import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if ((!user.synagogueName || !user.address) && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return children;
};

export default RequireAuth;
