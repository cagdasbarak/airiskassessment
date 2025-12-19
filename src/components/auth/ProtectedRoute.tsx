import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Uses useEffect to manage redirect side effects.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore.getState().isAuthenticated;
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login via imperative means to ensure full cleanup
      window.location.href = '/login';
    }
  }, [isAuthenticated]);
  if (!isAuthenticated) {
    // Return null while redirecting to prevent unauthorized component mounting
    return null;
  }
  return <>{children}</>;
}