// Permissions Context - RBAC management
// Date: 2026-01-13

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { permissionsService } from '@/services/permissionsService'
import type {
  UserWithRole,
  Permission,
  Resource,
  PermissionAction,
  PermissionResult,
} from '@/types/permissions'

interface PermissionsContextValue {
  // Current user
  user: UserWithRole | null
  loading: boolean
  
  // Permissions
  permissions: Permission[]
  
  // Role checks
  isFartechAdmin: boolean
  isOrgAdmin: boolean
  isRegularUser: boolean
  
  // Permission checks
  can: (resource: Resource, action: PermissionAction) => Promise<boolean>
  canSync: (resource: Resource, action: PermissionAction) => boolean
  check: (resource: Resource, action: PermissionAction) => Promise<PermissionResult>
  
  // Actions
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isFartechAdmin, setIsFartechAdmin] = useState(false)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  // Load user and permissions
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true)

      const [currentUser, userPermissions, isFartech, isAdmin] = await Promise.all([
        permissionsService.getCurrentUser(),
        permissionsService.getUserPermissions(),
        permissionsService.isFartechAdmin(),
        permissionsService.isOrgAdmin(),
      ])

      setUser(currentUser)
      setPermissions(userPermissions)
      setIsFartechAdmin(isFartech)
      setIsOrgAdmin(isAdmin)
    } catch (error) {
      console.error('Error loading permissions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check permission async
  const can = useCallback(
    async (resource: Resource, action: PermissionAction): Promise<boolean> => {
      return await permissionsService.canAccess(resource, action)
    },
    []
  )

  // Check permission sync (using cached permissions)
  const canSync = useCallback(
    (resource: Resource, action: PermissionAction): boolean => {
      if (isFartechAdmin) return true

      return permissions.some(
        (p) =>
          p.resource === resource &&
          (p.action === action || p.action === 'manage')
      )
    },
    [permissions, isFartechAdmin]
  )

  // Full permission check with result
  const check = useCallback(
    async (resource: Resource, action: PermissionAction): Promise<PermissionResult> => {
      return await permissionsService.checkPermission({ resource, action })
    },
    []
  )

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await loadPermissions()
  }, [loadPermissions])

  // Load on mount
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const value: PermissionsContextValue = {
    user,
    loading,
    permissions,
    isFartechAdmin,
    isOrgAdmin,
    isRegularUser: !isFartechAdmin && !isOrgAdmin,
    can,
    canSync,
    check,
    refreshPermissions,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider')
  }
  return context
}
