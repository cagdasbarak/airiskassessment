import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
/**
 * HomePage acts as a landing redirect.
 * If authenticated, go to Dashboard.
 * If not, go to Login.
 */
export function HomePage() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/login" replace />;
}