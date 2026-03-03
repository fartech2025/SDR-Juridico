import { Navigate, createBrowserRouter } from 'react-router-dom'

import AuthCallback from '@/pages/auth/AuthCallback'
import { AppShell } from '@/layouts/AppShell'
import { AgendaPage } from '@/pages/AgendaPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import { CasoPage } from '@/pages/CasoPage'
import { CasosPage } from '@/pages/CasosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DataJudPage } from '@/pages/DataJudPage'
import { DatabasePage } from '@/pages/DatabasePage'
import { DocumentosPage } from '@/pages/DocumentosPage'
import { FinanceiroPage } from '@/pages/FinanceiroPage'
import { TimesheetPage } from '@/pages/TimesheetPage'
import { DocumentoTemplatesPage } from '@/pages/DocumentoTemplatesPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { LeadsKanbanPage } from '@/pages/LeadsKanbanPage'
import { AuditoriaPage } from '@/pages/AuditoriaPage'
import { DiarioOficialPage } from '@/pages/DiarioOficialPage'
import { TarefasRootPage } from '@/pages/TarefasRootPage'
import { TarefasKanbanPage } from '@/pages/TarefasKanbanPage'
import TarefasArquivadasPage from '@/pages/TarefasArquivadasPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import UserManagement from '@/pages/UserManagement'
import PlanPage from '@/pages/PlanPage'
import { UserProfilePage } from '@/pages/UserProfilePage'
import DOUSyncLogsPage from '@/pages/DOUSyncLogsPage'
import OrgSettings from '@/pages/OrgSettings'
import {
  FartechDashboard,
  OrganizationsList,
  OrganizationForm,
  OrganizationDetails,
  OrganizationSettingsPage,
  SecurityMonitoring,
  SecurityReportPage,
} from '@/pages/fartech'

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
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        // Rota de onboarding — DEVE vir antes das outras para o guard não entrar em loop
        path: 'onboarding',
        element: <OnboardingPage />,
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
        path: 'documentos',
        element: <DocumentosPage />,
      },
      {
        path: 'documentos/templates',
        element: <DocumentoTemplatesPage />,
      },
      {
        path: 'indicadores',
        element: <Navigate to="/app/analytics" replace />,
      },
      {
        path: 'plano',
        element: <PlanPage />,
      },
      {
        path: 'perfil',
        element: <UserProfilePage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'org-settings',
        element: <OrgSettings />,
      },
      {
        path: 'membros',
        element: <UserManagement />,
      },
      {
        path: 'dou-logs',
        element: <DOUSyncLogsPage />,
      },
      {
        path: 'datajud',
        element: <DataJudPage />,
      },
      {
        path: 'database',
        element: <DatabasePage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'financeiro',
        element: <FinanceiroPage />,
      },
      {
        path: 'timesheet',
        element: <TimesheetPage />,
      },
      {
        path: 'auditoria',
        element: <AuditoriaPage />,
      },
      {
        path: 'diario-oficial',
        element: <DiarioOficialPage />,
      },
      {
        path: 'tarefas',
        element: <TarefasRootPage />,
      },
      {
        path: 'tarefas/kanban',
        element: <TarefasKanbanPage />,
      },
      {
        path: 'tarefas/arquivadas',
        element: <TarefasArquivadasPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="organizations" replace />,
      },
      {
        path: 'dashboard',
        element: <FartechDashboard />,
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
        path: 'organizations/:id/settings',
        element: <OrganizationSettingsPage />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'security',
        element: <SecurityMonitoring />,
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
    path: '*',
    element: <NotFoundPage />,
  },
])
