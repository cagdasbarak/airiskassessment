import React from 'react';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Standard React-compliant Security Guard for Application Access.
 * Uses reactive selectors and React Router components to prevent hook/context errors.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useAppStore.getState().isAuthenticated;
  if (!isAuth) {
    window.location.replace('/login');
    return <div />;
  }
  return <>{children}</>;
}