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
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <>{children}</>;
};