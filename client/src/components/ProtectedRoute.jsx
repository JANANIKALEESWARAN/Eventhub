import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  let user = { role: 'guest' };
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) user = JSON.parse(storedUser);
  } catch (e) {
    console.error("Auth error:", e);
  }
  
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    if (user.role === 'admin') return <Navigate to="/welcome" />;
    if (user.role === 'coordinator') return <Navigate to="/coordinator" />;
    if (user.role === 'user') return <Navigate to="/" />;
    return <Navigate to="/welcome" />;
  }

  return children;
};

export default ProtectedRoute;
