import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import { AgendaPage } from '@/pages/AgendaPage'
import { CasoPage } from '@/pages/CasoPage'
import { CasosPage } from '@/pages/CasosPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DocumentosPage } from '@/pages/DocumentosPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { IndicadoresPage } from '@/pages/IndicadoresPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
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
    element: <AppShell />,
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
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
