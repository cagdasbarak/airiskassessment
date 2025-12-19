import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened Reactive Security Guard for Application Access.
 * Prevents flicker by waiting for Zustand store hydration and using SPA navigation.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const _hasHydrated = useAppStore(s => s._hasHydrated);
  const location = useLocation();
  // Wait for the store to rehydrate from localStorage before making a decision
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }
  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}