import React, { useEffect, useMemo } from 'react'
import { Download, Save } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { interpolateTemplate, buildHtmlWithBranding } from '@/services/documentoTemplateService'
import type { DocumentoTemplate, OrgBranding } from '@/types/documentoTemplate'
import type { Caso } from '@/types/domain'

interface Props {
  open: boolean
  onClose: () => void
  template: DocumentoTemplate | null
  branding: OrgBranding
  // Contexto opcional: pré-preenche variáveis comuns
  caso?: Caso | null
  onSaveAsDocument?: (template: DocumentoTemplate, values: Record<string, string>) => Promise<void>
}

// Variáveis que podem ser auto-preenchidas a partir do contexto do Caso
function buildContextValues(caso?: Caso | null): Record<string, string> {
  if (!caso) return {}
  return {
    nome_cliente:       caso.cliente ?? '',
    numero_processo:    caso.numero_processo ?? '',
    area:               caso.area ?? '',
    responsavel:        caso.responsavel ?? '',
    tribunal:           caso.tribunal ?? '',
    classe_processual:  caso.classe_processual ?? '',
  }
}

export function TemplateGerarModal({ open, onClose, template, branding, caso, onSaveAsDocument }: Props) {
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [tab, setTab] = React.useState<'form' | 'preview'>('form')

  // Inicializa valores ao abrir
  useEffect(() => {
    if (!open || !template) return
    const ctx = buildContextValues(caso)
    const initial: Record<string, string> = {}
    for (const v of template.variaveis) {
      initial[v.key] = ctx[v.key] ?? ''
    }
    setValues(initial)
    setTab('form')
  }, [open, template, caso])

  // Preview HTML computado em tempo real
  const previewHtml = useMemo(() => {
    if (!template) return ''
    const interpolated = interpolateTemplate(template.conteudo, values)
    return buildHtmlWithBranding(interpolated, branding)
  }, [template, values, branding])

  const allRequiredFilled = useMemo(() => {
    if (!template) return false
    return template.variaveis
      .filter((v) => v.required)
      .every((v) => (values[v.key] ?? '').trim() !== '')
  }, [template, values])

  async function handleDownload() {
    if (!template) return
    setDownloading(true)
    try {
      const { documentoTemplateService } = await import('@/services/documentoTemplateService')
      await documentoTemplateService.downloadPdf(template, values, branding)
    } finally {
      setDownloading(false)
    }
  }

  async function handleSave() {
    if (!template || !onSaveAsDocument) return
    setSaving(true)
    try {
      await onSaveAsDocument(template, values)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!template) return null

  return (
    <Modal open={open} onClose={onClose} title={`Gerar: ${template.titulo}`} maxWidth="52rem" noPadding>
      <div className="flex flex-col" style={{ height: '76vh' }}>
        {/* Abas */}
        <div className="flex border-b border-gray-100">
          {(['form', 'preview'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'border-b-2 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={tab === t ? { borderColor: '#721011', color: '#721011' } : {}}
            >
              {t === 'form' ? 'Preencher Dados' : 'Visualizar'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'form' ? (
            /* ── Formulário de variáveis ────────────────────────────────────── */
            <div className="space-y-4 p-5">
              {template.variaveis.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Este template não tem variáveis configuradas. Clique em "Baixar PDF" para gerar o documento.
                </p>
              ) : (
                template.variaveis.map((v) => (
                  <div key={v.key} className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-gray-500">
                      {v.label}
                      {v.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    <Input
                      value={values[v.key] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
                      placeholder={v.placeholder ?? v.label}
                    />
                    {v.hint && <p className="text-xs text-gray-400">{v.hint}</p>}
                  </div>
                ))
              )}

              {caso && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  Campos marcados foram preenchidos automaticamente com dados do caso <strong>{caso.title}</strong>.
                </p>
              )}
            </div>
          ) : (
            /* ── Preview ────────────────────────────────────────────────────── */
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
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            {onSaveAsDocument && (
              <Button
                onClick={handleSave}
                disabled={saving || !allRequiredFilled}
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
