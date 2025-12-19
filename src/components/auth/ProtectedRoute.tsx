import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    // Safety check for state consistency
    if (isAuthenticated === undefined || isAuthenticated === null) {
      console.warn('[AUTH GUARD] Context loss detected, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  // Return null during the transition to prevent flash of protected content
  if (!isAuthenticated) {
    return null;
  }
  return <React.Fragment>{children}</React.Fragment>;
};