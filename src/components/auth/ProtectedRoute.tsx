import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Uses reactive store selectors to ensure UI stays in sync with auth state.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const location = useLocation();
  const [isHydrated, setIsHydrated] = useState(false);
  // Ensure we wait for Zustand persist hydration if necessary
  // In this simple implementation, we assume immediate availability or handle flickering via Navigate
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  if (!isHydrated) {
    return null; // Prevent flash during hydration
  }
  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}