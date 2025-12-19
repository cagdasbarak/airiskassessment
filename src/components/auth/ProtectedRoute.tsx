import React from 'react';
import { useAppStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Hardened Reactive Security Guard for Application Access.
 * Uses imperative store check with SPA-safe window.location redirect.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Imperative shallow sync auth check - no subscribe, StrictMode safe
  const isAuth = useAppStore.getState().isAuthenticated;
  if (!isAuth) {
    window.location.href = '/login';
    return null;
  }
  return <>{children}</>;
}