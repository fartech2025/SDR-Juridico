import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import { AgendaPage } from '@/pages/AgendaPage'
import { AuditoriaPage } from '@/pages/AuditoriaPage'
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
import { TarefasRootPage } from '@/pages/TarefasRootPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { UserProfilePage } from '@/pages/UserProfilePage'
import AuthCallback from '@/pages/auth/AuthCallback'

// Admin Pages
import OrganizationsList from '@/pages/fartech/OrganizationsList'
import OrganizationForm from '@/pages/fartech/OrganizationForm'
import OrganizationDetails from '@/pages/fartech/OrganizationDetails'
import OrganizationSettingsPage from '@/pages/fartech/OrganizationSettingsPage'
import SecurityMonitoringSimple from '@/pages/fartech/SecurityMonitoringSimple'
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
    path: '/auth/callback',
    element: <AuthCallback />,
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
        path: 'tarefas',
        element: <TarefasRootPage />,
      },
      {
        path: 'documentos',
        element: <DocumentosPage />,
      },
      {
        path: 'auditoria',
        element: <AuditoriaPage />,
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
        path: 'perfil',
        element: <UserProfilePage />,
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
      {
        path: 'security',
        element: <SecurityMonitoringSimple />,
      },
      {
        path: 'perfil',
        element: <UserProfilePage />,
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
      {
        path: 'perfil',
        element: <UserProfilePage />,
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
