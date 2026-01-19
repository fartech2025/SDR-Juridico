// Types for Role-Based Access Control (RBAC)
// Date: 2026-01-13
// Permission constants
export const FARTECH_ADMIN_PERMISSIONS = [
    // Full access to everything
    { resource: 'organizations', action: 'manage' },
    { resource: 'users', action: 'manage' },
    { resource: 'leads', action: 'manage' },
    { resource: 'clients', action: 'manage' },
    { resource: 'cases', action: 'manage' },
    { resource: 'documents', action: 'manage' },
    { resource: 'agenda', action: 'manage' },
    { resource: 'integrations', action: 'manage' },
    { resource: 'settings', action: 'manage' },
    { resource: 'billing', action: 'manage' },
    { resource: 'reports', action: 'manage' },
];
export const ORG_ADMIN_PERMISSIONS = [
    // Organization management
    { resource: 'organizations', action: 'read' },
    { resource: 'organizations', action: 'update' },
    // User management within org
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    // Full access to org data
    { resource: 'leads', action: 'manage' },
    { resource: 'clients', action: 'manage' },
    { resource: 'cases', action: 'manage' },
    { resource: 'documents', action: 'manage' },
    { resource: 'agenda', action: 'manage' },
    // Integrations and settings
    { resource: 'integrations', action: 'manage' },
    { resource: 'settings', action: 'manage' },
    // Billing (read only)
    { resource: 'billing', action: 'read' },
    // Reports
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'create' },
];
export const USER_PERMISSIONS = [
    // Read organization info
    { resource: 'organizations', action: 'read' },
    // Read users in org
    { resource: 'users', action: 'read' },
    // Standard CRUD for work items
    { resource: 'leads', action: 'create' },
    { resource: 'leads', action: 'read' },
    { resource: 'leads', action: 'update' },
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
    { resource: 'cases', action: 'create' },
    { resource: 'cases', action: 'read' },
    { resource: 'cases', action: 'update' },
    { resource: 'documents', action: 'create' },
    { resource: 'documents', action: 'read' },
    { resource: 'documents', action: 'update' },
    { resource: 'agenda', action: 'create' },
    { resource: 'agenda', action: 'read' },
    { resource: 'agenda', action: 'update' },
    { resource: 'agenda', action: 'delete' },
    // Read integrations
    { resource: 'integrations', action: 'read' },
    // Basic reports
    { resource: 'reports', action: 'read' },
];
// Helper to get permissions by role
export function getPermissionsByRole(role) {
    switch (role) {
        case 'fartech_admin':
            return FARTECH_ADMIN_PERMISSIONS;
        case 'org_admin':
            return ORG_ADMIN_PERMISSIONS;
        case 'user':
            return USER_PERMISSIONS;
        default:
            return [];
    }
}
// Role labels for UI
export const ROLE_LABELS = {
    fartech_admin: 'Administrador Fartech',
    org_admin: 'Gestor da Organização',
    user: 'Usuário',
};
export const ROLE_DESCRIPTIONS = {
    fartech_admin: 'Acesso total ao sistema, gerencia todas as organizações',
    org_admin: 'Gerencia usuários e configurações da organização',
    user: 'Acesso aos recursos da organização (leads, casos, agenda)',
};
