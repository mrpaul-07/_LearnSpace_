import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    const redirectMap = { admin: '/admin/dashboard', instructor: '/instructor/dashboard', student: '/dashboard' };
    return <Navigate to={redirectMap[user?.role] || '/'} replace />;
  }
  return children;
};

export default RoleRoute;
