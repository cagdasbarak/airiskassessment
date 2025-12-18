import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReportDetailsPage } from '@/pages/ReportDetailsPage'
import { LogsPage } from '@/pages/LogsPage'
import { useAppStore } from '@/lib/store'
const queryClient = new QueryClient();
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/reports",
    element: <ProtectedRoute><ReportsPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/reports/:id",
    element: <ProtectedRoute><ReportDetailsPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/logs",
    element: <ProtectedRoute><LogsPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)