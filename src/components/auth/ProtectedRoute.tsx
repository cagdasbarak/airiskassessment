import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Standard React-compliant Security Guard for Application Access.
 * Uses reactive selectors and React Router components to prevent hook/context errors.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // back to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}