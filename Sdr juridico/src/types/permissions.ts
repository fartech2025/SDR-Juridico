// Types for Role-Based Access Control (RBAC)
// Date: 2026-01-13

export type UserRole = 'fartech_admin' | 'org_admin' | 'user'

export interface Permission {
  resource: string
  action: PermissionAction
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage'

// Resources in the system
export type Resource = 
  | 'organizations'
  | 'users'
  | 'leads'
  | 'clients'
  | 'cases'
  | 'documents'
  | 'agenda'
  | 'integrations'
  | 'settings'
  | 'billing'
  | 'reports'

// Role definitions with permissions
export interface RoleDefinition {
  role: UserRole
  label: string
  description: string
  permissions: Permission[]
}

// Permission check helpers
export interface PermissionCheck {
  resource: Resource
  action: PermissionAction
  target_org_id?: string // For cross-org operations
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
}

// User with role information
export interface UserWithRole {
  id: string
  email: string
  name: string
  role: UserRole
  org_id: string | null
  is_fartech_admin: boolean
  department?: string
  position?: string
}

// Permission contexts
export interface PermissionContext {
  user: UserWithRole
  current_org_id: string | null
  is_fartech_admin: boolean
}

// Audit log for permission-sensitive operations
export interface PermissionAuditLog {
  id: string
  user_id: string
  action: string
  resource: Resource
  resource_id: string
  org_id: string
  success: boolean
  reason?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Permission constants
export const FARTECH_ADMIN_PERMISSIONS: Permission[] = [
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
]

export const ORG_ADMIN_PERMISSIONS: Permission[] = [
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
]

export const USER_PERMISSIONS: Permission[] = [
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
]

// Helper to get permissions by role
export function getPermissionsByRole(role: UserRole): Permission[] {
  switch (role) {
    case 'fartech_admin':
      return FARTECH_ADMIN_PERMISSIONS
    case 'org_admin':
      return ORG_ADMIN_PERMISSIONS
    case 'user':
      return USER_PERMISSIONS
    default:
      return []
  }
}

// Role labels for UI
export const ROLE_LABELS: Record<UserRole, string> = {
  fartech_admin: 'Administrador Fartech',
  org_admin: 'Gestor da Organização',
  user: 'Usuário',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  fartech_admin: 'Acesso total ao sistema, gerencia todas as organizações',
  org_admin: 'Gerencia usuários e configurações da organização',
  user: 'Acesso aos recursos da organização (leads, casos, agenda)',
}
