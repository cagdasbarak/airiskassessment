import { useAppStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Static no-hooks auth guard for stable routing.
 * Uses imperative redirect to prevent context loss crashes.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore.getState().isAuthenticated;
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  return children;
}
//