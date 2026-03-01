import React, { useEffect } from 'react'
import { FileText, Plus, Pencil, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpgradeWall } from '@/components/UpgradeWall'
import { TemplateEditorModal } from '@/components/documentos/TemplateEditorModal'
import { TemplateGerarModal } from '@/components/documentos/TemplateGerarModal'
import { useDocumentoTemplates } from '@/hooks/useDocumentoTemplates'
import { useOrgBranding } from '@/hooks/useOrgBranding'
import { usePermissionsContext } from '@/contexts/PermissionsContext'
import { usePlan } from '@/hooks/usePlan'
import { TEMPLATE_CATEGORIA_LABELS } from '@/types/documentoTemplate'
import type { DocumentoTemplate, TemplateCategoria } from '@/types/documentoTemplate'

const CATEGORIA_COLORS: Record<TemplateCategoria, string> = {
  contrato:    'bg-violet-50 text-violet-700',
  peticao:     'bg-purple-50 text-purple-700',
  procuracao:  'bg-amber-50 text-amber-700',
  declaracao:  'bg-green-50 text-green-700',
  notificacao: 'bg-red-50 text-red-700',
  outro:       'bg-gray-100 text-gray-600',
}

export function DocumentoTemplatesPage() {
  const { canUseTemplates } = usePlan()
  if (!canUseTemplates) {
    return <UpgradeWall feature="Templates de Documentos" minPlan="Profissional" />
  }
  return <TemplatesContent />
}

function TemplatesContent() {
  const { isOrgAdmin, isFartechAdmin } = usePermissionsContext()
  const canManage = isOrgAdmin || isFartechAdmin

  const { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } =
    useDocumentoTemplates()
  const { branding } = useOrgBranding()

  const [filterCategoria, setFilterCategoria] = React.useState<TemplateCategoria | 'todas'>('todas')
  const [showEditor, setShowEditor] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<DocumentoTemplate | null>(null)
  const [gerandoTemplate, setGerandoTemplate] = React.useState<DocumentoTemplate | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  useEffect(() => { void fetchTemplates() }, [fetchTemplates])

  const templatesFiltrados = React.useMemo(() => {
    if (filterCategoria === 'todas') return templates
    return templates.filter((t) => t.categoria === filterCategoria)
  }, [templates, filterCategoria])

  function abrirNovo() {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  function abrirEditar(t: DocumentoTemplate) {
    setEditingTemplate(t)
    setShowEditor(true)
  }

  async function handleSaveTemplate(input: Parameters<typeof createTemplate>[0]) {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, input)
    } else {
      await createTemplate(input)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este template? A ação pode ser desfeita pelo suporte.')) return
    setDeletingId(id)
    try { await deleteTemplate(id) } finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: '#721011' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Templates de Documentos</h1>
          <p className="text-sm text-gray-500">Crie e reutilize modelos de peças jurídicas</p>
        </div>
        {canManage && (
          <Button onClick={abrirNovo} style={{ backgroundColor: '#721011' }} className="text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-2">
        {(['todas', ...Object.keys(TEMPLATE_CATEGORIA_LABELS)] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategoria(cat as typeof filterCategoria)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategoria === cat
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={filterCategoria === cat ? { backgroundColor: '#721011' } : {}}
          >
            {cat === 'todas' ? 'Todas' : TEMPLATE_CATEGORIA_LABELS[cat as TemplateCategoria]}
            {cat !== 'todas' && (
              <span className="ml-1.5 opacity-70">
                {templates.filter((t) => t.categoria === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid de templates */}
      {templatesFiltrados.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Nenhum template encontrado.</p>
          {canManage && (
            <button
              onClick={abrirNovo}
              className="mt-2 text-sm font-medium underline"
              style={{ color: '#721011' }}
            >
              Criar o primeiro template
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templatesFiltrados.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-start justify-between p-4 pb-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIA_COLORS[t.categoria]}`}>
                    {TEMPLATE_CATEGORIA_LABELS[t.categoria]}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold text-gray-900 truncate" title={t.titulo}>
                    {t.titulo}
                  </h3>
                </div>
              </div>

              <div className="px-4 pb-3">
                <p className="text-xs text-gray-400">
                  {t.variaveis.length === 0
                    ? 'Sem variáveis'
                    : `${t.variaveis.length} variável${t.variaveis.length !== 1 ? 'is' : ''}: ${t.variaveis.map((v) => `{${v.key}}`).join(', ')}`}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-1 border-t border-gray-50 px-4 py-3">
                <Button
                  onClick={() => setGerandoTemplate(t)}
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  <Play className="mr-1.5 h-3 w-3" />
                  Usar Template
                </Button>
                {canManage && (
                  <>
                    <button
                      onClick={() => abrirEditar(t)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editor */}
      <TemplateEditorModal
        open={showEditor}
        onClose={() => setShowEditor(false)}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      {/* Modal Gerar */}
      <TemplateGerarModal
        open={gerandoTemplate !== null}
        onClose={() => setGerandoTemplate(null)}
        template={gerandoTemplate}
        branding={branding}
        onSaveAsDocument={async (tmpl, vals) => {
          const { documentoTemplateService } = await import('@/services/documentoTemplateService')
          await documentoTemplateService.generateFromTemplate(tmpl, vals, branding)
        }}
      />
    </div>
  )
}
