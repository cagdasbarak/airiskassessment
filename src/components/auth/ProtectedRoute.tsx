import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.replace('/login');
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return <>{children}</>;
  return null;
};