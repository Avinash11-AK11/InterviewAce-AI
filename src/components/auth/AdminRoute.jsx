import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminRoute() {
  const { userProfile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (userProfile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
