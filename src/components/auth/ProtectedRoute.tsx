import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened Reactive Security Guard for Application Access.
 * Subscribes to individual store primitives to ensure reactivity.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const _hasHydrated = useAppStore(s => s._hasHydrated);
  // Wait for persistence layer to rehydrate from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          <p className="text-xs text-muted-foreground animate-pulse font-medium uppercase tracking-widest">
            Resuming Session...
          </p>
        </div>
      </div>
    );
  }
  // Reactive redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}