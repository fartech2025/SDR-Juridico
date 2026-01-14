import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import { AgendaPage } from '@/pages/AgendaPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import { CasoPage } from '@/pages/CasoPage'
import { CasosPage } from '@/pages/CasosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DataJudPage } from '@/pages/DataJudPage'
import { DocumentosPage } from '@/pages/DocumentosPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { IndicadoresPage } from '@/pages/IndicadoresPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

// Admin Pages
import OrganizationsList from '@/pages/fartech/OrganizationsList'
import OrganizationForm from '@/pages/fartech/OrganizationForm'
import OrganizationDetails from '@/pages/fartech/OrganizationDetails'
import OrganizationSettingsPage from '@/pages/fartech/OrganizationSettingsPage'
import UserManagement from '@/pages/UserManagement'
import OrgSettings from '@/pages/OrgSettings'
import OrgSuspendedPage from '@/pages/OrgSuspendedPage'

// Guards
import { FartechGuard } from '@/components/guards/FartechGuard'
import { OrgAdminGuard } from '@/components/guards/OrgAdminGuard'
import { OrgActiveGuard } from '@/components/guards/OrgActiveGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <OrgActiveGuard>
          <AppShell />
        </OrgActiveGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'clientes',
        element: <ClientesPage />,
      },
      {
        path: 'casos',
        element: <CasosPage />,
      },
      {
        path: 'caso/:id',
        element: <CasoPage />,
      },
      {
        path: 'agenda',
        element: <AgendaPage />,
      },
      {
        path: 'documentos',
        element: <DocumentosPage />,
      },
      {
        path: 'indicadores',
        element: <IndicadoresPage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'datajud',
        element: <DataJudPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <FartechGuard>
          <AppShell />
        </FartechGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="organizations" replace />,
      },
      {
        path: 'organizations',
        element: <OrganizationsList />,
      },
      {
        path: 'organizations/new',
        element: <OrganizationForm />,
      },
      {
        path: 'organizations/:id',
        element: <OrganizationDetails />,
      },
      {
        path: 'organizations/:id/edit',
        element: <OrganizationForm />,
      },
      {
        path: 'organizations/:id/settings',
        element: <OrganizationSettingsPage />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
    ],
  },
  {
    path: '/org',
    element: (
      <ProtectedRoute>
        <OrgActiveGuard>
          <OrgAdminGuard>
            <AppShell />
          </OrgAdminGuard>
        </OrgActiveGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'settings',
        element: <OrgSettings />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
    ],
  },
  {
    path: '/org/suspended',
    element: (
      <ProtectedRoute>
        <OrgSuspendedPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
