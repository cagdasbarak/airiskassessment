import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReportDetailsPage } from '@/pages/ReportDetailsPage'
import { LogsPage } from '@/pages/LogsPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
const queryClient = new QueryClient();
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
        <Toaster richColors closeButton position="top-right" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)