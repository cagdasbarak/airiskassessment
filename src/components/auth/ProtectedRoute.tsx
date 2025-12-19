import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Uses reactive selectors and the standard navigate hook to prevent context mismatches.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) {
    // Return null while redirecting to prevent unauthorized component mounting
    return null;
  }
  return <>{children}</>;
}