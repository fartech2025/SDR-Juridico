import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { UsuarioRow, UserRole } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { ensureUsuario } from '@/services/usuariosService'

const roleLabels: Record<UserRole, string> = {
  fartech_admin: 'Admin',
  org_admin: 'Gestor',
  user: 'Usuario',
}

const resolveRoleFromPermissoes = (permissoes: string[], memberRole?: string | null): UserRole => {
  if (permissoes.includes('fartech_admin')) {
    return 'fartech_admin'
  }
  if (memberRole && ['admin', 'gestor', 'org_admin'].includes(memberRole)) {
    return 'org_admin'
  }
  if (permissoes.includes('gestor') || permissoes.includes('org_admin')) {
    return 'org_admin'
  }
  return 'user'
}

const deriveDisplayName = (
  profile: UsuarioRow | null,
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null
) => {
  const metadataName =
    user?.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as { nome?: string; nome_completo?: string }).nome_completo ||
        (user.user_metadata as { nome?: string }).nome
      : undefined
  const fallbackEmail = user?.email ? user.email.split('@')[0] : null
  return (profile?.nome_completo || metadataName || fallbackEmail || 'Usuario').trim()
}

const deriveInitials = (value: string) => {
  const parts = value.split(' ').filter(Boolean)
  if (parts.length === 0) return 'US'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UsuarioRow | null>(null)
  const [role, setRole] = useState<UserRole>('user')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const missingTableRef = useRef(false)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setProfile(null)
      setRole('user')
      setOrgId(null)
      setOrgName(null)
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    const load = async () => {
      const { usuario, missingUsuariosTable, seed } = await ensureUsuario(user)

      if (!active) return

      if (missingUsuariosTable) {
        missingTableRef.current = true
      }

      const nextProfile = usuario || null
      setProfile(nextProfile)
      const permissoes = nextProfile?.permissoes || seed?.permissoes || []

      const { data: memberData } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const membershipRole = memberData?.role || seed?.role || null
      setRole(resolveRoleFromPermissoes(permissoes, membershipRole))
      const resolvedOrgId = memberData?.org_id || seed?.org_id || null
      setOrgId(resolvedOrgId)

      if (resolvedOrgId) {
        const { data: orgData } = await supabase
          .from('orgs')
          .select('id, nome, name, slug')
          .eq('id', resolvedOrgId)
          .maybeSingle()

        const resolvedOrgName =
          (orgData && ((orgData as { nome?: string }).nome || (orgData as { name?: string }).name)) ||
          (orgData as { slug?: string } | null)?.slug ||
          null
        setOrgName(resolvedOrgName)
      } else {
        setOrgName(null)
      }

      setLoading(false)
    }

    load().catch((err) => {
      if (!active) return
      setError(err instanceof Error ? err : new Error('Erro ao carregar dados do usuario'))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [authLoading, user?.id])

  const displayName = useMemo(() => deriveDisplayName(profile, user), [profile, user])
  const shortName = useMemo(() => displayName.split(' ').filter(Boolean)[0] || displayName, [displayName])
  const initials = useMemo(() => deriveInitials(displayName), [displayName])
  const roleLabel = roleLabels[role]

  return {
    loading,
    error,
    user,
    profile,
    orgId,
    orgName: orgName || 'SDR Juridico Online',
    role,
    roleLabel,
    displayName,
    shortName,
    initials,
  }
}
