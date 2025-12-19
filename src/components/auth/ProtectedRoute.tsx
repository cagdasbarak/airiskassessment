import { useAppStore } from '@/lib/store';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
/**
 * Compliance Guard for Stable Navigation.
 * Uses static store checks to prevent context mismatches and hook violations.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentPath = window.location.pathname;
  if (!useAppStore.getState().isAuthenticated && currentPath !== '/login') {
    window.location.href = '/login';
    return null;
  }
  return <>{children}</>;
}