import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Uses reactive store selectors and useEffect for redirection to prevent render-phase errors.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) {
    return null;
  }
  return <>{children}</>;
}