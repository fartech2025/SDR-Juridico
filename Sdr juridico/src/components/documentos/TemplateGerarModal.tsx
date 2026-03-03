import React, { useEffect, useMemo } from 'react'
import { Download, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { interpolateTemplate, buildHtmlWithBranding } from '@/services/documentoTemplateService'
import type { DocumentoTemplate, OrgBranding, VariavelTipo } from '@/types/documentoTemplate'
import type { Caso } from '@/types/domain'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Props {
  open: boolean
  onClose: () => void
  template: DocumentoTemplate | null
  branding: OrgBranding
  caso?: Caso | null
  onSaveAsDocument?: (template: DocumentoTemplate, values: Record<string, string>) => Promise<void>
}

// ── Mask helpers ──────────────────────────────────────────────────────────────
function maskCPF(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskCNPJ(v: string): string {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents  = parseInt(digits, 10)
  return 'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

// ── Token resolver ────────────────────────────────────────────────────────────
function resolveDefault(
  raw: string,
  ctx: { responsavel?: string; orgNome?: string; advogado?: string },
): string {
  const today = new Date().toLocaleDateString('pt-BR')
  return raw
    .replace(/\$hoje/g, today)
    .replace(/\$responsavel/g, ctx.responsavel ?? '')
    .replace(/\$org/g, ctx.orgNome ?? '')
    .replace(/\$advogado/g, ctx.advogado ?? '')
}

// ── Context pre-fill from Caso ────────────────────────────────────────────────
function buildContextValues(caso?: Caso | null): Record<string, string> {
  if (!caso) return {}
  return {
    nome_cliente:      caso.cliente           ?? '',
    numero_processo:   caso.numero_processo   ?? '',
    area:              caso.area              ?? '',
    responsavel:       caso.responsavel       ?? '',
    tribunal:          caso.tribunal          ?? '',
    classe_processual: caso.classe_processual ?? '',
  }
}

// ── Typed input component ─────────────────────────────────────────────────────
interface TypedInputProps {
  tipo: VariavelTipo | undefined
  value: string
  options?: string[]
  placeholder?: string
  hasError: boolean
  onChange: (val: string) => void
}

function TypedInput({ tipo, value, options, placeholder, hasError, onChange }: TypedInputProps) {
  const errorCls = hasError
    ? 'border-red-400 bg-red-50 focus:ring-1 focus:ring-red-300'
    : ''

  const resolved = tipo ?? 'texto'

  if (resolved === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ${errorCls}`}
      >
        <option value="">Selecione…</option>
        {(options ?? []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    )
  }

  if (resolved === 'data') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-gray-200 px-3 py-2 text-sm ${errorCls}`}
      />
    )
  }

  if (resolved === 'cpf') {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(maskCPF(e.target.value))}
        placeholder={placeholder ?? '000.000.000-00'}
        maxLength={14}
        className={errorCls}
      />
    )
  }

  if (resolved === 'cnpj') {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(maskCNPJ(e.target.value))}
        placeholder={placeholder ?? '00.000.000/0000-00'}
        maxLength={18}
        className={errorCls}
      />
    )
  }

  if (resolved === 'moeda') {
    return (
      <Input
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(raw ? formatCurrency(raw) : '')
        }}
        placeholder={placeholder ?? 'R$ 0,00'}
        className={errorCls}
      />
    )
  }

  // default: texto
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={errorCls}
    />
  )
}

// ── Main modal component ──────────────────────────────────────────────────────
export function TemplateGerarModal({ open, onClose, template, branding, caso, onSaveAsDocument }: Props) {
  const { currentOrg }   = useOrganizationContext()
  const { user, shortName } = useCurrentUser()

  const [values, setValues]               = React.useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = React.useState<Set<string>>(new Set())
  const [saving, setSaving]               = React.useState(false)
  const [downloading, setDownloading]     = React.useState(false)
  const [tab, setTab]                     = React.useState<'form' | 'preview'>('form')

  // Build context for token resolution
  const tokenCtx = useMemo(() => ({
    responsavel: caso?.responsavel ?? shortName ?? user?.email ?? '',
    orgNome:     currentOrg?.name ?? '',
    advogado:    shortName ?? user?.email ?? '',
  }), [caso, shortName, user, currentOrg])

  // Initialize values when modal opens
  useEffect(() => {
    if (!open || !template) return
    const ctx = buildContextValues(caso)
    const initial: Record<string, string> = {}
    for (const v of template.variaveis) {
      // Priority: context value > resolved default > ''
      const ctxVal = ctx[v.key] ?? ''
      const def    = v.defaultValue ? resolveDefault(v.defaultValue, tokenCtx) : ''
      initial[v.key] = ctxVal || def
    }
    setValues(initial)
    setValidationErrors(new Set())
    setTab('form')
  }, [open, template, caso, tokenCtx])

  // Live preview HTML
  const previewHtml = useMemo(() => {
    if (!template) return ''
    // For date fields, format YYYY-MM-DD → DD/MM/YYYY in preview
    const formatted: Record<string, string> = {}
    for (const v of template.variaveis) {
      const val = values[v.key] ?? ''
      if ((v.tipo ?? 'texto') === 'data' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-')
        formatted[v.key] = `${d}/${m}/${y}`
      } else {
        formatted[v.key] = val
      }
    }
    const interpolated = interpolateTemplate(template.conteudo, formatted)
    return buildHtmlWithBranding(interpolated, branding)
  }, [template, values, branding])

  // Validate required fields
  function validate(): boolean {
    if (!template) return false
    const errors = new Set<string>()
    for (const v of template.variaveis) {
      if (v.required && !(values[v.key] ?? '').trim()) {
        errors.add(v.key)
      }
    }
    setValidationErrors(errors)
    if (errors.size > 0) {
      toast.error('Preencha os campos obrigatórios antes de continuar')
      return false
    }
    return true
  }

  async function handleDownload() {
    if (!template) return
    if (!validate()) return
    setDownloading(true)
    try {
      const { documentoTemplateService } = await import('@/services/documentoTemplateService')
      // Format date values before download
      const formatted = getFormattedValues()
      await documentoTemplateService.downloadPdf(template, formatted, branding)
    } finally {
      setDownloading(false)
    }
  }

  async function handleSave() {
    if (!template || !onSaveAsDocument) return
    if (!validate()) return
    setSaving(true)
    try {
      await onSaveAsDocument(template, getFormattedValues())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // Format date fields (YYYY-MM-DD → DD/MM/YYYY) for interpolation
  function getFormattedValues(): Record<string, string> {
    if (!template) return values
    const out: Record<string, string> = {}
    for (const v of template.variaveis) {
      const val = values[v.key] ?? ''
      if ((v.tipo ?? 'texto') === 'data' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-')
        out[v.key] = `${d}/${m}/${y}`
      } else {
        out[v.key] = val
      }
    }
    return out
  }

  if (!template) return null

  return (
    <Modal open={open} onClose={onClose} title={`Gerar: ${template.titulo}`} maxWidth="52rem" noPadding>
      <div className="flex flex-col" style={{ height: '76vh' }}>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['form', 'preview'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-b-2 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={tab === t ? { borderColor: '#721011', color: '#721011' } : {}}
            >
              {t === 'form' ? 'Preencher Dados' : 'Visualizar'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'form' ? (
            /* ── Form ─────────────────────────────────────────────────────────── */
            <div className="space-y-4 p-5">
              {/* Hint: variáveis de caso sem caso selecionado */}
              {!caso && template.variaveis.some((v) =>
                ['responsavel', 'advogado', 'nome_cliente', 'numero_processo', 'tribunal'].includes(v.key) ||
                (v.defaultValue ?? '').match(/\$(responsavel|advogado)/)
              ) && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-xs text-blue-700">
                    Selecione um caso vinculado para resolver variáveis como <strong>responsável</strong> e <strong>advogado</strong> automaticamente.
                  </p>
                </div>
              )}

              {template.variaveis.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Este template não tem variáveis. Clique em "Baixar PDF" para gerar o documento.
                </p>
              ) : (
                template.variaveis.map((v) => {
                  const hasError = validationErrors.has(v.key)
                  return (
                    <div key={v.key} className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-gray-500">
                        {v.label}
                        {v.required && <span className="ml-1 text-red-500">*</span>}
                        {v.tipo && v.tipo !== 'texto' && (
                          <span className="ml-2 rounded bg-gray-100 px-1 py-0.5 text-gray-400 normal-case font-normal tracking-normal">
                            {v.tipo}
                          </span>
                        )}
                      </label>
                      <TypedInput
                        tipo={v.tipo}
                        value={values[v.key] ?? ''}
                        options={v.options}
                        placeholder={v.placeholder ?? v.label}
                        hasError={hasError}
                        onChange={(val) => {
                          setValues((prev) => ({ ...prev, [v.key]: val }))
                          if (hasError && val.trim()) {
                            setValidationErrors((prev) => {
                              const next = new Set(prev)
                              next.delete(v.key)
                              return next
                            })
                          }
                        }}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500">Campo obrigatório</p>
                      )}
                      {v.hint && <p className="text-xs text-gray-400">{v.hint}</p>}
                    </div>
                  )
                })
              )}

              {caso && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  Campos foram pré-preenchidos com dados do caso <strong>{caso.title}</strong>.
                </p>
              )}
            </div>
          ) : (
            /* ── Preview ──────────────────────────────────────────────────────── */
            <div className="bg-gray-100 p-4 h-full">
              <div
                className="bg-white rounded shadow mx-auto overflow-auto"
                style={{ maxWidth: 794, minHeight: 500 }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            {onSaveAsDocument && (
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#721011' }}
                className="text-white hover:opacity-90"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar como Documento'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
