import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate, useLocation } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Robust authentication guard that prevents context loss crashes.
 * Calls hooks at the top level and handles navigation in a stable useEffect.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // Check if auth state is loaded. If false, redirect to login.
    if (isAuthenticated === false) {
      console.warn('[AUTH] Unauthorized access attempt to:', location.pathname);
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [isAuthenticated, navigate, location.pathname]);
  // If state is not yet ready or explicitly false, prevent rendering protected nodes
  if (!isAuthenticated) {
    return null;
  }
  return <React.Fragment>{children}</React.Fragment>;
}