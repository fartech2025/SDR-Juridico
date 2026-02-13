import React, { Suspense } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'

// ── Light pages (eager) ──────────────────────────────────────
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import AuthCallback from '@/pages/auth/AuthCallback'
import { RootRedirect } from '@/components/RootRedirect'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Guards
import { FartechGuard } from '@/components/guards/FartechGuard'
import { OrgAdminGuard } from '@/components/guards/OrgAdminGuard'
import { OrgActiveGuard } from '@/components/guards/OrgActiveGuard'

// ── Heavy pages (lazy — code splitting per route) ────────────
const AppShell = React.lazy(() => import('@/layouts/AppShell').then(m => ({ default: m.AppShell })))
const AgendaPage = React.lazy(() => import('@/pages/AgendaPage').then(m => ({ default: m.AgendaPage })))
const AuditoriaPage = React.lazy(() => import('@/pages/AuditoriaPage').then(m => ({ default: m.AuditoriaPage })))
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'))
const CasoPage = React.lazy(() => import('@/pages/CasoPage').then(m => ({ default: m.CasoPage })))
const CasosPage = React.lazy(() => import('@/pages/CasosPage').then(m => ({ default: m.CasosPage })))
const ClientesPage = React.lazy(() => import('@/pages/ClientesPage').then(m => ({ default: m.ClientesPage })))
const ConfigPage = React.lazy(() => import('@/pages/ConfigPage').then(m => ({ default: m.ConfigPage })))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const DataJudPage = React.lazy(() => import('@/pages/DataJudPage').then(m => ({ default: m.DataJudPage })))
const DiarioOficialPage = React.lazy(() => import('@/pages/DiarioOficialPage').then(m => ({ default: m.DiarioOficialPage })))
const DOUSyncLogsPage = React.lazy(() => import('@/pages/DOUSyncLogsPage'))
const DocumentosPage = React.lazy(() => import('@/pages/DocumentosPage').then(m => ({ default: m.DocumentosPage })))
const IndicadoresPage = React.lazy(() => import('@/pages/IndicadoresPage').then(m => ({ default: m.IndicadoresPage })))
const LeadsPage = React.lazy(() => import('@/pages/LeadsPage').then(m => ({ default: m.LeadsPage })))
const LeadsKanbanPage = React.lazy(() => import('@/pages/LeadsKanbanPage').then(m => ({ default: m.LeadsKanbanPage })))
const TarefasRootPage = React.lazy(() => import('@/pages/TarefasRootPage').then(m => ({ default: m.TarefasRootPage })))
const TarefasArquivadasPage = React.lazy(() => import('@/pages/TarefasArquivadasPage'))
const UserProfilePage = React.lazy(() => import('@/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })))

// Admin Pages (lazy)
const OrganizationsList = React.lazy(() => import('@/pages/fartech/OrganizationsList'))
const OrganizationForm = React.lazy(() => import('@/pages/fartech/OrganizationForm'))
const OrganizationDetails = React.lazy(() => import('@/pages/fartech/OrganizationDetails'))
const OrganizationSettingsPage = React.lazy(() => import('@/pages/fartech/OrganizationSettingsPage'))
const SecurityMonitoringSimple = React.lazy(() => import('@/pages/fartech/SecurityMonitoringSimple'))
const SecurityReportPage = React.lazy(() => import('@/pages/fartech/SecurityReportPage'))
const UserManagement = React.lazy(() => import('@/pages/UserManagement'))
const OrgSettings = React.lazy(() => import('@/pages/OrgSettings'))
const OrgSuspendedPage = React.lazy(() => import('@/pages/OrgSuspendedPage'))
const NoOrganizationPage = React.lazy(() => import('@/pages/NoOrganizationPage'))

// ── Suspense fallback ────────────────────────────────────────
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <div style={{
      width: 36, height: 36, border: '3px solid var(--brand-primary-100, #F5E6E6)',
      borderTopColor: 'var(--brand-primary, #721011)', borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
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
          <Lazy><AppShell /></Lazy>
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
        path: 'leads/kanban',
        element: <LeadsKanbanPage />,
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
        path: 'tarefas/arquivadas',
        element: <TarefasArquivadasPage />,
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
        path: 'diario-oficial',
        element: <DiarioOficialPage />,
      },
      {
        path: 'dou-logs',
        element: <DOUSyncLogsPage />,
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
          <Lazy><AppShell /></Lazy>
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
        path: 'security/report',
        element: <SecurityReportPage />,
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
            <Lazy><AppShell /></Lazy>
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
    path: '/no-organization',
    element: (
      <ProtectedRoute>
        <NoOrganizationPage />
      </ProtectedRoute>
    ),
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
