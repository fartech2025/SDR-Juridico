import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import type { OrgBranding } from '@/types/documentoTemplate'
import { DEFAULT_BRANDING } from '@/types/documentoTemplate'

// ── Mapper DB row → domain ─────────────────────────────────────────────────────
type DbBrandingRow = {
  id: string
  org_id: string
  logo_url: string | null
  cor_primaria: string
  cor_secundaria: string
  nome_display: string | null
  oab_registro: string | null
  endereco: string | null
  telefone: string | null
  rodape_texto: string | null
}

function mapRow(row: DbBrandingRow): OrgBranding {
  return {
    id:           row.id,
    orgId:        row.org_id,
    logoUrl:      row.logo_url      ?? undefined,
    corPrimaria:  row.cor_primaria,
    corSecundaria: row.cor_secundaria,
    nomeDisplay:  row.nome_display  ?? undefined,
    oabRegistro:  row.oab_registro  ?? undefined,
    endereco:     row.endereco      ?? undefined,
    telefone:     row.telefone      ?? undefined,
    rodapeTexto:  row.rodape_texto  ?? undefined,
  }
}

// ── Service ────────────────────────────────────────────────────────────────────
export const orgBrandingService = {
  // Busca o branding da org atual. Retorna DEFAULT_BRANDING se não existir.
  async getBranding(): Promise<OrgBranding> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) return DEFAULT_BRANDING

      const { data, error } = await supabase
        .from('org_branding')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) return { ...DEFAULT_BRANDING, orgId }
      return mapRow(data as DbBrandingRow)
    } catch (err) {
      // Em caso de falha (tabela ainda não migrada, etc.) retorna defaults
      return DEFAULT_BRANDING
    }
  },

  // Cria ou atualiza o branding da org (UPSERT por org_id).
  async upsertBranding(input: Partial<Omit<OrgBranding, 'id' | 'orgId'>>): Promise<OrgBranding> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

    const payload: Record<string, unknown> = {
      org_id: orgId,
    }
    if (input.logoUrl       !== undefined) payload.logo_url       = input.logoUrl       ?? null
    if (input.corPrimaria   !== undefined) payload.cor_primaria   = input.corPrimaria
    if (input.corSecundaria !== undefined) payload.cor_secundaria = input.corSecundaria
    if (input.nomeDisplay   !== undefined) payload.nome_display   = input.nomeDisplay   ?? null
    if (input.oabRegistro   !== undefined) payload.oab_registro   = input.oabRegistro   ?? null
    if (input.endereco      !== undefined) payload.endereco       = input.endereco      ?? null
    if (input.telefone      !== undefined) payload.telefone       = input.telefone      ?? null
    if (input.rodapeTexto   !== undefined) payload.rodape_texto   = input.rodapeTexto   ?? null

    const { data, error } = await supabase
      .from('org_branding')
      .upsert(payload, { onConflict: 'org_id' })
      .select('*')
      .single()

    if (error) throw new AppError(error.message, 'database_error')
    return mapRow(data as DbBrandingRow)
  },

  // Faz upload do logo para o bucket org-logos e retorna a URL pública.
  async uploadLogo(file: File): Promise<string> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

    const ext  = file.name.split('.').pop() ?? 'png'
    const path = `${orgId}/logo.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('org-logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) throw new AppError(uploadErr.message, 'storage_error')

    const { data } = supabase.storage.from('org-logos').getPublicUrl(path)
    // Quebra cache adicionando timestamp
    return `${data.publicUrl}?t=${Date.now()}`
  },
}
