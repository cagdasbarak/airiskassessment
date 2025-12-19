import React from 'react';
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
  const { isAuthenticated, _hasHydrated } = useAppStore.getState();
  
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  
  return <>{children}</>;
}