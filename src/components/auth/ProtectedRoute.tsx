import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Loader2, ShieldCheck } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened Reactive Security Guard.
 * Monitors Zustand hydration state to prevent false-negative redirects on refresh.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Reactive hooks for state and hydration
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  // While waiting for localStorage hydration, show a secure loading state
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[#F38020]/40" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initializing Secure Context...</p>
      </div>
    );
  }
  // If hydration finished and not authenticated, redirect to login via Navigate component
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}