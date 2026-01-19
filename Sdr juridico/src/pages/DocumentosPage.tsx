import * as React from 'react'
import { Check, Plus, X, Upload as UploadIcon, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadDocumentos } from '@/components/UploadDocumentos'
import heroLight from '@/assets/hero-light.svg'
import { formatDateTime } from '@/utils/format'
import type { Documento } from '@/types/domain'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useCasos } from '@/hooks/useCasos'
import { useOrganization } from '@/hooks/useOrganization'
import { cn } from '@/utils/cn'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Documento['status']) => {
  if (status === 'aprovado' || status === 'completo') {
    return 'border-success-border bg-success-bg text-success'
  }
  if (status === 'solicitado') {
    return 'border-info-border bg-info-bg text-info'
  }
  if (status === 'rejeitado') {
    return 'border-danger-border bg-danger-bg text-danger'
  }
  return 'border-warning-border bg-warning-bg text-warning'
}

const filterControlClass =
  'h-11 rounded-full border border-border bg-white px-4 text-sm text-text shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const formControlClass =
  'h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text shadow-soft placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const labelClass = 'text-xs font-semibold text-text'

export const DocumentosPage = () => {
  const {
    documentos,
    loading,
    error,
    updateDocumento,
    deleteDocumento,
    marcarCompleto,
    marcarRejeitado,
    solicitarNovamente,
  } = useDocumentos()
  const { casos } = useCasos()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageDocs = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const [params] = useSearchParams()
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [typeFilter, setTypeFilter] = React.useState('todos')
  const [clienteFilter, setClienteFilter] = React.useState('todos')
  const [activeTab, setActiveTab] = React.useState('Tudo')
  const [mostrarUpload, setMostrarUpload] = React.useState(false)
  const [editingDoc, setEditingDoc] = React.useState<Documento | null>(null)
  const [docForm, setDocForm] = React.useState({ title: '', type: '' })
  const [savingDoc, setSavingDoc] = React.useState(false)

  const tabs = ['Tudo', 'Docs', 'Agenda', 'Comercial', 'Juridico', 'Automacao']

  const filters = React.useMemo(
    () => ({
      status: Array.from(new Set(documentos.map((doc) => doc.status))),
      type: Array.from(new Set(documentos.map((doc) => doc.type))),
      cliente: Array.from(new Set(documentos.map((doc) => doc.cliente))),
    }),
    [documentos],
  )

  const filteredDocs = React.useMemo(() => {
    return documentos.filter((doc) => {
      const matchesStatus = statusFilter === 'todos' || doc.status === statusFilter
      const matchesType = typeFilter === 'todos' || doc.type === typeFilter
      const matchesCliente =
        clienteFilter === 'todos' || doc.cliente === clienteFilter
      return matchesStatus && matchesType && matchesCliente
    })
  }, [statusFilter, typeFilter, clienteFilter, documentos])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredDocs.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState

  const selectedCase =
    clienteFilter !== 'todos'
      ? casos.find((caso) => caso.cliente === clienteFilter)
      : undefined

  const checklistItems = selectedCase
    ? documentos.filter((doc) => doc.casoId === selectedCase.id)
    : []

  const resetFilters = () => {
    setStatusFilter('todos')
    setTypeFilter('todos')
    setClienteFilter('todos')
  }

  const handleUploadComplete = () => {
    toast.success('Documento enviado com sucesso!')
    // Aqui você pode recarregar a lista de documentos
    // Por enquanto, apenas fechamos o modal
    setTimeout(() => {
      setMostrarUpload(false)
    }, 1500)
  }

  const handleAprovar = async (docId: string, titulo: string) => {
    try {
      await marcarCompleto(docId)
      toast.success(`Documento aprovado: ${titulo}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar documento'
      toast.error(message)
    }
  }

  const handleRejeitar = async (docId: string, titulo: string) => {
    try {
      await marcarRejeitado(docId)
      toast.success(`Documento rejeitado: ${titulo}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao rejeitar documento'
      toast.error(message)
    }
  }

  const handleSolicitar = async (docId: string, titulo: string) => {
    try {
      await solicitarNovamente(docId)
      toast.success(`Solicitado novamente: ${titulo}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar documento'
      toast.error(message)
    }
  }

  const resetEditForm = () => {
    setEditingDoc(null)
    setDocForm({ title: '', type: '' })
  }

  const handleEditarDocumento = (doc: Documento) => {
    if (!canManageDocs) {
      toast.error('Apenas gestores podem editar documentos.')
      return
    }
    setEditingDoc(doc)
    setDocForm({ title: doc.title, type: doc.type })
    setMostrarUpload(false)
  }

  const handleSalvarEdicao = async () => {
    if (!editingDoc) return
    setSavingDoc(true)
    try {
      await updateDocumento(editingDoc.id, {
        titulo: docForm.title || editingDoc.title,
        tipo: docForm.type || editingDoc.type,
      })
      toast.success(`Documento atualizado: ${editingDoc.title}`)
      resetEditForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar documento'
      toast.error(message)
    } finally {
      setSavingDoc(false)
    }
  }

  const handleExcluirDocumento = async (docId: string, titulo: string) => {
    if (!canManageDocs) {
      toast.error('Apenas gestores podem excluir documentos.')
      return
    }
    const confirmed = window.confirm(`Excluir o documento "${titulo}"? Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    try {
      await deleteDocumento(docId)
      toast.success(`Documento excluído: ${titulo}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir documento'
      toast.error(message)
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        'bg-base text-text',
      )}
    >
      <div className="space-y-5">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]','border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              'opacity-90',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-xs uppercase tracking-[0.3em]',
                'text-text-muted',
              )}
            >
              Documentos
            </p>
            <h2 className={cn('font-display text-2xl', 'text-text')}>
              Gestao central
            </h2>
            <p className={cn('text-sm', 'text-text-muted')}>
              Filtre por status, tipo e cliente para validar pendencias.
            </p>
          </div>
        </header>

      <PageState
        status={pageState}
        emptyTitle="Nenhum documento encontrado"
        emptyDescription="Ajuste os filtros para localizar os documentos."
      >
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          {/* Seção de Upload */}
          {mostrarUpload && (
            <Card
              className={cn(
                'xl:col-span-2 border',
                'border-border bg-surface/90',
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Upload de Documentos</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarUpload(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <UploadDocumentos
                  casoId={clienteFilter !== 'todos' ? selectedCase?.id : undefined}
                  orgId={currentOrg?.id}
                  onUploadComplete={handleUploadComplete}
                  disabled={!canManageDocs}
                />
              </CardContent>
            </Card>
          )}
          {editingDoc && (
            <Card
              className={cn(
                'xl:col-span-2 border',
                'border-border bg-surface/90',
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Editar documento</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetEditForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Titulo
                    </label>
                    <input
                      value={docForm.title}
                      onChange={(event) => setDocForm((prev) => ({ ...prev, title: event.target.value }))}
                      className={formControlClass}
                      placeholder="Nome do documento"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Tipo
                    </label>
                    <input
                      value={docForm.type}
                      onChange={(event) => setDocForm((prev) => ({ ...prev, type: event.target.value }))}
                      className={formControlClass}
                      placeholder="Ex: contrato, procuração"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-full px-5"
                    onClick={resetEditForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-10 rounded-full px-5"
                    onClick={handleSalvarEdicao}
                    disabled={savingDoc}
                  >
                    {savingDoc ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
            )}
          >
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Documentos pendentes</CardTitle>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-subtle">
                  <span>Total: {documentos.length}</span>
                  <span>Exibindo: {filteredDocs.length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-10 rounded-full px-4"
                  onClick={() => {
                    if (!canManageDocs) {
                      toast.error('Apenas gestores podem enviar documentos.')
                      return
                    }
                    setMostrarUpload(!mostrarUpload)
                  }}
                  disabled={!canManageDocs}
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  {mostrarUpload ? 'Ocultar Upload' : 'Upload Documento'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full px-4"
                  disabled={!canManageDocs}
                >
                  Nova solicitacao
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-soft',
                  'border-border bg-white',
                )}
              >
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        activeTab === tab
                          ?'border-brand-secondary/60 bg-brand-secondary/10 text-brand-secondary'
                          :'border-border bg-white text-text-muted hover:bg-surface-2 hover:text-text'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <select
                    className={filterControlClass}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="todos">Status</option>
                    {filters.status.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    className={filterControlClass}
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="todos">Tipo</option>
                    {filters.type.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    className={filterControlClass}
                    value={clienteFilter}
                    onChange={(event) => setClienteFilter(event.target.value)}
                  >
                    <option value="todos">Cliente</option>
                    {filters.cliente.map((cliente) => (
                      <option key={cliente} value={cliente}>
                        {cliente}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className={cn(
                    'text-xs',
                    'text-text-muted hover:text-text',
                  )}
                  onClick={resetFilters}
                >
                  Limpar filtros
                </button>
              </div>

              <div
                className={cn(
                  'overflow-hidden rounded-2xl border shadow-soft',
                  'border-border bg-white',
                )}
              >
                <table className="w-full border-collapse text-left text-sm">
                  <thead
                    className={cn(
                      'text-[11px] uppercase tracking-[0.22em]',
                      'bg-surface-2 text-text-muted',
                    )}
                  >
                    <tr>
                      <th className="px-4 py-3" />
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Atualizado</th>
                      <th className="px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className={cn(
                          'border-t text-text','border-border hover:bg-surface-2/60',
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-border bg-white text-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-text">
                            {doc.title}
                          </div>
                          <div className="text-xs text-text-subtle">{doc.type}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {doc.cliente}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusPill(
                              doc.status,
                            )}`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-subtle">
                          {formatDateTime(doc.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {canManageDocs ? (
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  'text-text-muted hover:text-success',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleAprovar(doc.id, doc.title)
                                }}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Validar
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  'text-text-muted hover:text-danger',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleRejeitar(doc.id, doc.title)
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                                Rejeitar
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  'text-text-muted hover:text-primary',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleSolicitar(doc.id, doc.title)
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Solicitar
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  'text-text-muted hover:text-brand-secondary',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleEditarDocumento(doc)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1',
                                  'text-text-muted hover:text-danger',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleExcluirDocumento(doc.id, doc.title)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-subtle">Sem permissao</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">Checklist do caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-muted">
              {selectedCase ? (
                <>
                  <div
                    className={cn(
                      'rounded-2xl border px-3 py-3 shadow-soft',
                      'border-border bg-white',
                    )}
                  >
                    <p className="text-sm font-semibold text-text">
                      {selectedCase.title}
                    </p>
                    <p className="text-xs text-text-subtle">
                      Cliente: {selectedCase.cliente}
                    </p>
                  </div>
                  {checklistItems.length === 0 && (
                    <div
                      className={cn(
                        'rounded-2xl border px-3 py-3 shadow-soft',
                        'border-border bg-white',
                      )}
                    >
                      Nenhum documento vinculado ao caso.
                    </div>
                  )}
                  {checklistItems.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-3 py-2 text-xs shadow-soft',
                        'border-border bg-white',
                      )}
                    >
                      <span className="text-text">{doc.title}</span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusPill(
                          doc.status,
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div
                  className={cn(
                    'rounded-2xl border px-3 py-4 text-sm text-text-muted shadow-soft',
                    'border-border bg-white',
                  )}
                >
                  Selecione um cliente para visualizar o checklist do caso.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageState>
      </div>
    </div>
  )
}
