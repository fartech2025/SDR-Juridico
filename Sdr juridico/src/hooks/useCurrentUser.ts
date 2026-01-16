import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { UsuarioRow, UserRole } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

const roleLabels: Record<UserRole, string> = {
  fartech_admin: 'Admin',
  org_admin: 'Gestor',
  user: 'Usuario',
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const missingTableRef = useRef(false)

  const isMissingUsuariosTable = (err?: { code?: string; message?: string } | null) => {
    const message = err?.message || ''
    return (
      err?.code === '42P01' ||
      message.includes('schema cache') ||
      message.includes("Could not find the table 'public.usuarios'")
    )
  }

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setProfile(null)
      setRole('user')
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    const load = async () => {
      if (missingTableRef.current) {
        setProfile(null)
        setRole('user')
        setLoading(false)
        return
      }

      const { data, error: profileError } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email, permissoes, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (profileError) {
        if (isMissingUsuariosTable(profileError)) {
          missingTableRef.current = true
        } else {
          const message = profileError?.message || 'Erro ao carregar dados do usuario'
          setError(new Error(message))
        }
      }

      const nextProfile = (data as UsuarioRow) || null
      setProfile(nextProfile)
      const permissoes = nextProfile?.permissoes || []
      if (permissoes.includes('admin') || permissoes.includes('fartech_admin')) {
        setRole('fartech_admin')
      } else if (permissoes.includes('gestor') || permissoes.includes('org_admin')) {
        setRole('org_admin')
      } else {
        setRole('user')
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
  const orgId = null
  const orgName = 'SDR Juridico Online'

  return {
    loading,
    error,
    user,
    profile,
    orgId,
    orgName,
    role,
    roleLabel,
    displayName,
    shortName,
    initials,
  }
}
