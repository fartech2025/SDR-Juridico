import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { OrgMemberRow, ProfileRow, UserRole } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

type MemberWithOrg = Omit<OrgMemberRow, 'org'> & { 
  org: { nome: string | null } | null 
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  advogado: 'Advogado',
  secretaria: 'Secretaria',
  leitura: 'Leitura',
}

const deriveDisplayName = (
  profile: ProfileRow | null,
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null
) => {
  const metadataName =
    user?.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as { nome?: string }).nome
      : undefined
  const fallbackEmail = user?.email ? user.email.split('@')[0] : null
  return (profile?.nome || metadataName || fallbackEmail || 'Usuario').trim()
}

const deriveInitials = (value: string) => {
  const parts = value.split(' ').filter(Boolean)
  if (parts.length === 0) return 'US'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [member, setMember] = useState<MemberWithOrg | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setProfile(null)
      setMember(null)
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    const load = async () => {
      const [profileResult, memberResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, created_at, nome, email, telefone, avatar_url, metadata, org_id, role, is_fartech_admin')
          .eq('user_id', user.id)
          .limit(1),
        
        supabase
          .from('org_members')
          .select('id, org_id, user_id, role, ativo, created_at, updated_at, org:orgs!org_id(nome)')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle()
      ])

      if (!active) return

      if (profileResult.error) {
        const message = profileResult.error?.message || 'Erro ao carregar dados do usuario'
        setError(new Error(message))
      }

      setProfile((profileResult.data?.[0] as ProfileRow) || null)
      setMember((memberResult.data as MemberWithOrg) || null)

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
  const roleLabel = member?.role ? roleLabels[member.role] : 'Usuario'
  const orgId = member?.org_id ?? null
  const orgName = member?.org?.nome || 'SDR Juridico Online'

  return {
    loading,
    error,
    user,
    profile,
    orgId,
    orgName,
    role: member?.role ?? null,
    roleLabel,
    displayName,
    shortName,
    initials,
  }
}
