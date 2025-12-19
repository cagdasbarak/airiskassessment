import React from 'react';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Security Guard for Application Access.
 * Uses synchronous store.getState() check with window redirect to eliminate all hook/context errors.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useAppStore.getState().isAuthenticated;
  if (!isAuth) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }
  return <>{children}</>;
}