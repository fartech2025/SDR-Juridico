import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { AgendaPage } from '@/pages/AgendaPage';
import { AuditoriaPage } from '@/pages/AuditoriaPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import { CasoPage } from '@/pages/CasoPage';
import { CasosPage } from '@/pages/CasosPage';
import { ClientesPage } from '@/pages/ClientesPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DataJudPage } from '@/pages/DataJudPage';
import { DocumentosPage } from '@/pages/DocumentosPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { IndicadoresPage } from '@/pages/IndicadoresPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { TarefasPage } from '@/pages/TarefasPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import AuthCallback from '@/pages/auth/AuthCallback';
// Admin Pages
import OrganizationsList from '@/pages/fartech/OrganizationsList';
import OrganizationForm from '@/pages/fartech/OrganizationForm';
import OrganizationDetails from '@/pages/fartech/OrganizationDetails';
import OrganizationSettingsPage from '@/pages/fartech/OrganizationSettingsPage';
import UserManagement from '@/pages/UserManagement';
import OrgSettings from '@/pages/OrgSettings';
import OrgSuspendedPage from '@/pages/OrgSuspendedPage';
// Guards
import { FartechGuard } from '@/components/guards/FartechGuard';
import { OrgAdminGuard } from '@/components/guards/OrgAdminGuard';
import { OrgActiveGuard } from '@/components/guards/OrgActiveGuard';
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(Navigate, { to: "/app/dashboard", replace: true }),
    },
    {
        path: '/login',
        element: _jsx(LoginPage, {}),
    },
    {
        path: '/auth/callback',
        element: _jsx(AuthCallback, {}),
    },
    {
        path: '/forgot-password',
        element: _jsx(ForgotPasswordPage, {}),
    },
    {
        path: '/reset-password',
        element: _jsx(ResetPasswordPage, {}),
    },
    {
        path: '/app',
        element: (_jsx(ProtectedRoute, { children: _jsx(OrgActiveGuard, { children: _jsx(AppShell, {}) }) })),
        children: [
            {
                index: true,
                element: _jsx(Navigate, { to: "dashboard", replace: true }),
            },
            {
                path: 'dashboard',
                element: _jsx(DashboardPage, {}),
            },
            {
                path: 'leads',
                element: _jsx(LeadsPage, {}),
            },
            {
                path: 'clientes',
                element: _jsx(ClientesPage, {}),
            },
            {
                path: 'casos',
                element: _jsx(CasosPage, {}),
            },
            {
                path: 'caso/:id',
                element: _jsx(CasoPage, {}),
            },
            {
                path: 'agenda',
                element: _jsx(AgendaPage, {}),
            },
            {
                path: 'tarefas',
                element: _jsx(TarefasPage, {}),
            },
            {
                path: 'documentos',
                element: _jsx(DocumentosPage, {}),
            },
            {
                path: 'auditoria',
                element: _jsx(AuditoriaPage, {}),
            },
            {
                path: 'indicadores',
                element: _jsx(IndicadoresPage, {}),
            },
            {
                path: 'config',
                element: _jsx(ConfigPage, {}),
            },
            {
                path: 'perfil',
                element: _jsx(UserProfilePage, {}),
            },
            {
                path: 'datajud',
                element: _jsx(DataJudPage, {}),
            },
            {
                path: 'analytics',
                element: _jsx(AnalyticsPage, {}),
            },
        ],
    },
    {
        path: '/admin',
        element: (_jsx(ProtectedRoute, { children: _jsx(FartechGuard, { children: _jsx(AppShell, {}) }) })),
        children: [
            {
                index: true,
                element: _jsx(Navigate, { to: "organizations", replace: true }),
            },
            {
                path: 'organizations',
                element: _jsx(OrganizationsList, {}),
            },
            {
                path: 'organizations/new',
                element: _jsx(OrganizationForm, {}),
            },
            {
                path: 'organizations/:id',
                element: _jsx(OrganizationDetails, {}),
            },
            {
                path: 'organizations/:id/edit',
                element: _jsx(OrganizationForm, {}),
            },
            {
                path: 'organizations/:id/settings',
                element: _jsx(OrganizationSettingsPage, {}),
            },
            {
                path: 'users',
                element: _jsx(UserManagement, {}),
            },
            {
                path: 'perfil',
                element: _jsx(UserProfilePage, {}),
            },
        ],
    },
    {
        path: '/org',
        element: (_jsx(ProtectedRoute, { children: _jsx(OrgActiveGuard, { children: _jsx(OrgAdminGuard, { children: _jsx(AppShell, {}) }) }) })),
        children: [
            {
                path: 'settings',
                element: _jsx(OrgSettings, {}),
            },
            {
                path: 'users',
                element: _jsx(UserManagement, {}),
            },
            {
                path: 'perfil',
                element: _jsx(UserProfilePage, {}),
            },
        ],
    },
    {
        path: '/org/suspended',
        element: (_jsx(ProtectedRoute, { children: _jsx(OrgSuspendedPage, {}) })),
    },
    {
        path: '*',
        element: _jsx(NotFoundPage, {}),
    },
]);
