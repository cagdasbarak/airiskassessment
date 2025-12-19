import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Security Guard for Application Access.
 * Refactored to use <Navigate /> to avoid hook dispatcher conflicts (useContext null) 
 * during early render phases or store hydration.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    // Redirect to login while saving the attempted location for post-auth redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}