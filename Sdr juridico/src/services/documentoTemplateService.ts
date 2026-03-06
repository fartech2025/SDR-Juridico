import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'
import type {
  DocumentoTemplate,
  DocumentoTemplateCreateInput,
  DocumentoTemplateUpdateInput,
  TemplateVariavel,
  OrgBranding,
} from '@/types/documentoTemplate'
import { DEFAULT_BRANDING } from '@/types/documentoTemplate'

// ── Tipo interno do DB ─────────────────────────────────────────────────────────
type DbTemplateRow = {
  id: string
  org_id: string
  titulo: string
  categoria: string
  conteudo: string
  variaveis: TemplateVariavel[]
  criado_por: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapRowToTemplate(row: DbTemplateRow): DocumentoTemplate {
  return {
    id:         row.id,
    orgId:      row.org_id,
    titulo:     row.titulo,
    categoria:  row.categoria as DocumentoTemplate['categoria'],
    conteudo:   row.conteudo,
    variaveis:  Array.isArray(row.variaveis) ? row.variaveis : [],
    criadoPor:  row.criado_por ?? undefined,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
    deletedAt:  row.deleted_at,
  }
}

// ── Interpolação de variáveis ──────────────────────────────────────────────────
// Substitui {nome_cliente} → valor correspondente no HTML do template
export function interpolateTemplate(html: string, values: Record<string, string>): string {
  return html.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`)
}

// ── Extrai variáveis de um HTML (detecta {nome_var}) ──────────────────────────
export function extractVariables(html: string): string[] {
  const matches = html.matchAll(/\{(\w+)\}/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

// ── Wrapper html2pdf (lazy import — não disponível em SSR) ────────────────────
async function htmlToPdfBlob(html: string): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default
  const element = document.createElement('div')
  element.innerHTML = html
  document.body.appendChild(element)

  const blob: Blob = await new Promise((resolve, reject) => {
    html2pdf()
      .set({
        margin:      [15, 15, 15, 15],
        filename:    'documento.pdf',
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .outputPdf('blob')
      .then(resolve)
      .catch(reject)
  })

  document.body.removeChild(element)
  return blob
}

// ── Monta HTML com branding (cabeçalho + rodapé + marca d'água) ───────────────
export function buildHtmlWithBranding(content: string, branding: OrgBranding): string {
  const b = { ...DEFAULT_BRANDING, ...branding }
  const logoHtml = b.logoUrl
    ? `<img src="${b.logoUrl}" style="height:56px;object-fit:contain;" />`
    : `<div style="width:56px;height:56px;border-radius:8px;background:${b.corPrimaria};"></div>`

  const watermarkHtml = b.marcaDagua?.trim()
    ? `<div style="
        position:fixed;top:0;left:0;right:0;bottom:0;
        display:flex;align-items:center;justify-content:center;
        pointer-events:none;z-index:9999;overflow:hidden;
      ">
        <span style="
          font-size:80px;font-weight:900;
          color:${b.corPrimaria};opacity:0.07;
          transform:rotate(-45deg);white-space:nowrap;
          font-family:'DM Sans',system-ui,sans-serif;
          letter-spacing:0.1em;text-transform:uppercase;
        ">${b.marcaDagua}</span>
      </div>`
    : ''

  return `
    <div style="font-family:'DM Sans',system-ui,sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto;position:relative;">
      ${watermarkHtml}
      <header style="display:flex;justify-content:space-between;align-items:center;
                     border-bottom:2px solid ${b.corPrimaria};padding-bottom:16px;margin-bottom:32px;">
        ${logoHtml}
        <div style="text-align:right;">
          <strong style="font-size:14px;color:${b.corPrimaria};">${b.nomeDisplay ?? ''}</strong>
          ${b.oabRegistro ? `<div style="font-size:11px;color:#6B5E58;margin-top:2px;">${b.oabRegistro}</div>` : ''}
        </div>
      </header>

      <main style="line-height:1.7;font-size:13px;">
        ${content}
      </main>

      <footer style="border-top:1px solid #e5e7eb;margin-top:48px;padding-top:12px;
                     display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;">
        <span>${[b.endereco, b.telefone].filter(Boolean).join(' · ')}</span>
        <span>${b.rodapeTexto ?? ''}</span>
      </footer>
    </div>
  `
}

// ── Service ────────────────────────────────────────────────────────────────────
export const documentoTemplateService = {
  async listTemplates(): Promise<DocumentoTemplate[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      let query = supabase
        .from('documento_templates')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (orgId) query = query.eq('org_id', orgId)

      const { data, error } = await query
      if (error) throw new AppError(error.message, 'database_error')
      return (data ?? []).map((r) => mapRowToTemplate(r as DbTemplateRow))
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao listar templates', 'database_error')
    }
  },

  async getTemplate(id: string): Promise<DocumentoTemplate | null> {
    try {
      const { orgId } = await resolveOrgScope()
      const { data, error } = await supabase
        .from('documento_templates')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) return null

      const row = data as DbTemplateRow
      if (orgId && row.org_id !== orgId) return null
      return mapRowToTemplate(row)
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao buscar template', 'database_error')
    }
  },

  async createTemplate(input: DocumentoTemplateCreateInput): Promise<DocumentoTemplate> {
    try {
      const { orgId, userId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const { data, error } = await supabase
        .from('documento_templates')
        .insert({
          org_id:    orgId,
          titulo:    input.titulo,
          categoria: input.categoria,
          conteudo:  input.conteudo,
          variaveis: input.variaveis,
          criado_por: userId ?? null,
        })
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')

      const template = mapRowToTemplate(data as DbTemplateRow)
      void logAuditChange({ orgId, action: 'create', entity: 'documento_template', entityId: template.id, details: { titulo: template.titulo } })
      return template
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao criar template', 'database_error')
    }
  },

  async updateTemplate(id: string, updates: DocumentoTemplateUpdateInput): Promise<DocumentoTemplate> {
    try {
      const { orgId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const dbUpdates: Record<string, unknown> = {}
      if (updates.titulo    !== undefined) dbUpdates.titulo    = updates.titulo
      if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria
      if (updates.conteudo  !== undefined) dbUpdates.conteudo  = updates.conteudo
      if (updates.variaveis !== undefined) dbUpdates.variaveis = updates.variaveis

      const { data, error } = await supabase
        .from('documento_templates')
        .update(dbUpdates)
        .eq('id', id)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')

      const template = mapRowToTemplate(data as DbTemplateRow)
      void logAuditChange({ orgId, action: 'update', entity: 'documento_template', entityId: id, details: updates as Record<string, unknown> })
      return template
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao atualizar template', 'database_error')
    }
  },

  // Soft delete — templates são patrimônio da organização
  async deleteTemplate(id: string): Promise<void> {
    try {
      const { orgId, userId } = await resolveOrgScope()
      if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

      const { error } = await supabase
        .from('documento_templates')
        .update({ deleted_at: new Date().toISOString(), deleted_by: userId ?? null })
        .eq('id', id)
        .eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      void logAuditChange({ orgId, action: 'delete', entity: 'documento_template', entityId: id })
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('Erro ao excluir template', 'database_error')
    }
  },

  // Gera PDF e faz download no browser — sem salvar no sistema
  async downloadPdf(template: DocumentoTemplate, values: Record<string, string>, branding: OrgBranding): Promise<void> {
    const interpolated = interpolateTemplate(template.conteudo, values)
    const html = buildHtmlWithBranding(interpolated, branding)
    const html2pdf = (await import('html2pdf.js')).default
    const element = document.createElement('div')
    element.innerHTML = html
    document.body.appendChild(element)

    await html2pdf()
      .set({
        margin:      [15, 15, 15, 15],
        filename:    `${template.titulo}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save()

    document.body.removeChild(element)
  },

  // Gera PDF como Blob (para upload Drive ou Supabase Storage)
  async generatePdfBlob(template: DocumentoTemplate, values: Record<string, string>, branding: OrgBranding): Promise<Blob> {
    const interpolated = interpolateTemplate(template.conteudo, values)
    const html = buildHtmlWithBranding(interpolated, branding)
    return htmlToPdfBlob(html)
  },

  // Gera PDF, faz upload ao Drive (se conectado) ou ao Storage (fallback),
  // e registra o documento na tabela documentos. Retorna { documentoId, url }.
  async generateFromTemplate(
    template: DocumentoTemplate,
    values: Record<string, string>,
    branding: OrgBranding,
    casoId?: string,
  ): Promise<{ documentoId: string; url: string }> {
    const { orgId, userId } = await resolveOrgScope()
    if (!orgId) throw new AppError('Organizacao nao encontrada', 'auth_error')

    const pdfBlob = await this.generatePdfBlob(template, values, branding)
    const today   = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    const fileName = `${template.titulo} - ${today}.pdf`

    // ── Upload para Drive (obrigatório — sem fallback para Storage) ────────
    const { driveService } = await import('./driveService')
    const googleOk   = await driveService.isConnected('google_drive')
    const onedriveOk = await driveService.isConnected('onedrive')
    const provider   = googleOk ? 'google_drive' : onedriveOk ? 'onedrive' : null

    if (!provider) {
      throw new AppError(
        'Conecte o Google Drive ou OneDrive em Configurações → Integrações para gerar documentos.',
        'drive_not_connected',
      )
    }

    const rootId   = await driveService.ensureFolder(provider, 'SDR Jurídico')
    let targetId   = rootId

    if (casoId) {
      const { data: caso } = await supabase.from('casos').select('titulo').eq('id', casoId).maybeSingle()
      if (caso?.titulo) {
        targetId = await driveService.ensureFolder(provider, `Caso - ${(caso as { titulo: string }).titulo}`, rootId)
      }
    }

    const uploaded = await driveService.uploadPdf(provider, pdfBlob, fileName, targetId)

    // ── Registra metadados na tabela documentos ────────────────────────────
    const docPayload: Record<string, unknown> = {
      org_id:           orgId,
      title:            template.titulo,
      bucket:           'docs',
      storage_path:     '',
      mime_type:        'application/pdf',
      size_bytes:       pdfBlob.size,
      caso_id:          casoId ?? null,
      uploaded_by:      userId ?? null,
      drive_file_id:    uploaded.fileId,
      drive_provider:   provider,
      drive_url:        uploaded.webViewLink,
      meta: {
        status:              'pendente',
        tipo:                template.categoria,
        arquivo_nome:        fileName,
        gerado_de_template:  template.id,
      },
    }

    const { data, error } = await supabase
      .from('documentos')
      .insert([docPayload])
      .select('id')
      .single()

    if (error) throw new AppError(error.message, 'database_error')

    return { documentoId: (data as { id: string }).id, url: uploaded.webViewLink }
  },
}
