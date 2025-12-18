import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Loader2, ShieldCheck } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Hardened reactive security guard
 * Uses granular selectors to ensure the UI transitions correctly after hydration
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  useEffect(() => {
    if (hasHydrated) {
      console.log(`[RISKGUARD] Auth Guard: hydrated=${hasHydrated}, authenticated=${isAuthenticated}`);
    }
  }, [hasHydrated, isAuthenticated]);
  if (!hasHydrated) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='relative mb-4'>
          <Loader2 className='h-12 w-12 animate-spin text-[#F38020]' />
          <ShieldCheck className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[#F38020]/40' />
        </div>
        <p className='text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse'>
          Initializing Secure Context...
        </p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}