import type { User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabaseClient'
import type { UsuarioRow } from '@/lib/supabaseClient'

type UsuarioSeed = {
  nome_completo: string
  email: string
  permissoes: string[]
  org_id: string | null
  role: string | null
  is_fartech_admin: boolean
}

export type EnsureUsuarioResult = {
  usuario: UsuarioRow | null
  missingUsuariosTable: boolean
  seed: UsuarioSeed | null
}

const getString = (value: unknown) => (typeof value === 'string' ? value : null)
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : null)

const normalizeRole = (value: string | null | undefined) => {
  if (!value) return null
  return value.toLowerCase().trim()
}

const buildPermissoes = (roles: string[], isFartechAdmin: boolean) => {
  const perms = new Set<string>()
  if (isFartechAdmin || roles.includes('fartech_admin')) {
    perms.add('fartech_admin')
  }
  if (roles.some((role) => ['org_admin', 'admin', 'gestor'].includes(role))) {
    perms.add('org_admin')
    if (roles.includes('gestor')) {
      perms.add('gestor')
    }
  }
  if (perms.size === 0) {
    perms.add('user')
  }
  return Array.from(perms)
}

const isMissingTable = (err: { code?: string; message?: string } | null | undefined, table: string) => {
  const message = err?.message || ''
  return (
    err?.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes(`public.${table}`) ||
    message.includes(`table \"${table}\"`) ||
    message.includes(`relation \"public.${table}\"`)
  )
}

const deriveSeedFromUser = async (user: User): Promise<UsuarioSeed> => {
  const metadata = (user.user_metadata && typeof user.user_metadata === 'object')
    ? (user.user_metadata as Record<string, unknown>)
    : {}

  const metadataName =
    getString(metadata.nome_completo) ||
    getString(metadata.nome) ||
    getString(metadata.name) ||
    getString(metadata.full_name) ||
    null
  const metadataRole = normalizeRole(getString(metadata.role) || getString(metadata.perfil))
  const metadataOrgId = getString(metadata.org_id)
  const metadataFartechAdmin =
    getBoolean(metadata.is_fartech_admin) ?? getBoolean(metadata.fartech_admin) ?? false

  const roleCandidates = [metadataRole].filter(Boolean) as string[]
  const isFartechAdmin = metadataFartechAdmin || roleCandidates.includes('fartech_admin')
  const permissoes = buildPermissoes(roleCandidates, isFartechAdmin)

  const fallbackEmail = user.email || ''
  const fallbackName = fallbackEmail ? fallbackEmail.split('@')[0] : 'Usuario'

  return {
    nome_completo: (metadataName || fallbackName || 'Usuario').trim(),
    email: user.email || fallbackEmail,
    permissoes,
    org_id: metadataOrgId || null,
    role: metadataRole || null,
    is_fartech_admin: isFartechAdmin,
  }
}

export async function ensureUsuario(user: User): Promise<EnsureUsuarioResult> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome_completo, email, permissoes, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    const seed = await deriveSeedFromUser(user)
    if (isMissingTable(error, 'usuarios')) {
      return { usuario: null, missingUsuariosTable: true, seed }
    }
    console.warn('[usuariosService] Failed to load usuarios:', error)
    return { usuario: null, missingUsuariosTable: false, seed }
  }

  if (data) {
    return { usuario: data as UsuarioRow, missingUsuariosTable: false, seed: null }
  }

  const seed = await deriveSeedFromUser(user)
  const { data: created, error: insertError } = await supabase
    .from('usuarios')
    .upsert(
      {
        id: user.id,
        nome_completo: seed.nome_completo,
        email: seed.email,
        permissoes: seed.permissoes,
      },
      { onConflict: 'id' },
    )
    .select('id, nome_completo, email, permissoes, created_at, updated_at')
    .maybeSingle()

  if (insertError) {
    if (isMissingTable(insertError, 'usuarios')) {
      return { usuario: null, missingUsuariosTable: true, seed }
    }
    console.warn('[usuariosService] Failed to upsert usuarios:', insertError)
    return { usuario: null, missingUsuariosTable: false, seed }
  }

  return { usuario: (created as UsuarioRow) || null, missingUsuariosTable: false, seed }
}
