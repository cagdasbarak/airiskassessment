import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened Reactive Security Guard for Application Access.
 * Adheres to React Router best practices with declarative redirects.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    // We use a declarative Navigate component to ensure the redirect
    // happens during the correct phase of the React lifecycle.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}