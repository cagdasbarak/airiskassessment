import React from 'react';
import { useAppStore } from '@/lib/store';
import { Navigate, useLocation } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Robust authentication guard that prevents context loss crashes.
 * Uses <Navigate /> instead of useNavigate + useEffect for zero-render redirection.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const location = useLocation();
  // Explicit check for the authentication state
  if (isAuthenticated === false) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  // Handle initial hydration or null state
  if (isAuthenticated === null || isAuthenticated === undefined) {
    return null;
  }
  return <React.Fragment>{children}</React.Fragment>;
}