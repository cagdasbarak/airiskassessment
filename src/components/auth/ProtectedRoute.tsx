import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened Reactive Security Guard for Application Access.
 * Prevents flicker by waiting for Zustand store hydration.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const isHydrated = useAppStore(s => s._hasHydrated);
  const location = useLocation();
  // If the store hasn't hydrated from localStorage yet, 
  // we hold the render to prevent false-negative redirects.
  if (!isHydrated) {
    return null; 
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}