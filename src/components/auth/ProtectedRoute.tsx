import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Checks authentication status and ensures persistence hydration is complete.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const location = useLocation();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    // Check if the store has hydrated from persistent storage
    const checkHydration = () => {
      const hydrated = useAppStore.persist.hasHydrated();
      if (hydrated) {
        setIsHydrated(true);
      } else {
        // Retry shortly if not yet hydrated
        setTimeout(checkHydration, 10);
      }
    };
    checkHydration();
  }, []);
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}