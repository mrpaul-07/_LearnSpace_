// ============================================================
// LearnSpace - Route Guard Components
// ============================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

// Requires login
export const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Requires specific role(s)
export const RoleRoute = ({ children, roles }) => {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    const redirectMap = {
      admin: '/admin/dashboard',
      instructor: '/instructor/dashboard',
      student: '/dashboard'
    };
    return <Navigate to={redirectMap[user?.role] || '/'} replace />;
  }
  return children;
};

export default ProtectedRoute;
