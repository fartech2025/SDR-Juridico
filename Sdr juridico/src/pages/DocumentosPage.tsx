import * as React from 'react'
import { Check, Plus, X, Upload as UploadIcon, Pencil, Trash2, FileText, Clock, CheckCircle, AlertCircle, Eye, ExternalLink, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { UploadDocumentos } from '@/components/UploadDocumentos'
import { DocumentoViewer } from '@/components/DocumentoViewer'
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

const statusBadge = (status: Documento['status']) => {
  if (status === 'aprovado' || status === 'completo') {
    return 'bg-green-100 text-green-700'
  }
  if (status === 'solicitado') {
    return 'bg-blue-100 text-blue-700'
  }
  if (status === 'rejeitado') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-amber-100 text-amber-700'
}

export const DocumentosPage = () => {
  const {
    documentos,
    loading,
    error,
    fetchDocumentos,
    updateDocumento,
    deleteDocumento,
    marcarCompleto,
    marcarRejeitado,
    marcarVisualizado,
    solicitarNovamente,
    abrirDocumento,
    downloadDocumento,
  } = useDocumentos()
  const { casos } = useCasos()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  // Permitir upload para qualquer usuário autenticado da organização
  const canManageDocs = isFartechAdmin || ['org_admin', 'gestor', 'admin', 'advogado', 'estagiario', 'secretaria'].includes(currentRole || '') || !!currentOrg
  const [params] = useSearchParams()
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [typeFilter, setTypeFilter] = React.useState('todos')
  const [clienteFilter, setClienteFilter] = React.useState('todos')
  const [mostrarUpload, setMostrarUpload] = React.useState(false)
  const [editingDoc, setEditingDoc] = React.useState<Documento | null>(null)
  const [docForm, setDocForm] = React.useState({ title: '', type: '' })
  const [savingDoc, setSavingDoc] = React.useState(false)
  // Estado do viewer de documento
  const [viewerDoc, setViewerDoc] = React.useState<{ 
    id: string
    url: string
    titulo: string
    fileName?: string
    status: Documento['status']
  } | null>(null)

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

  const stats = React.useMemo(() => ({
    total: documentos.length,
    pendentes: documentos.filter(d => d.status === 'pendente' || d.status === 'solicitado').length,
    aprovados: documentos.filter(d => d.status === 'aprovado' || d.status === 'completo').length,
    rejeitados: documentos.filter(d => d.status === 'rejeitado').length,
  }), [documentos])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredDocs.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState
  const emptyAction = canManageDocs ? (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => {
        setMostrarUpload(true)
      }}
    >
      <UploadIcon className="h-4 w-4" />
      Upload documento
    </button>
  ) : null

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
    void fetchDocumentos()
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

  const handleVisualizar = async (docId: string, titulo: string) => {
    try {
      await marcarVisualizado(docId)
      toast.success(`Documento marcado como visualizado: ${titulo}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como visualizado'
      toast.error(message)
    }
  }

  const handleAbrirDocumento = async (doc: Documento) => {
    if (!doc.url) {
      toast.error('Este documento não possui arquivo anexado')
      return
    }
    try {
      const signedUrl = await abrirDocumento(doc.url)
      // Abre no modal viewer
      setViewerDoc({
        id: doc.id,
        url: signedUrl,
        titulo: doc.title,
        fileName: doc.fileName,
        status: doc.status,
      })
      // Marca como visualizado automaticamente
      await marcarVisualizado(doc.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao abrir documento'
      toast.error(message)
    }
  }

  const handleDownloadDocumento = async (doc: Documento) => {
    if (!doc.url) {
      toast.error('Este documento não possui arquivo anexado')
      return
    }
    try {
      const nomeArquivo = doc.fileName || `${doc.title}.pdf`
      await downloadDocumento(doc.url, nomeArquivo)
      toast.success(`Download iniciado: ${doc.title}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar documento'
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
      void fetchDocumentos()
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
      void fetchDocumentos()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir documento'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-surface-alt p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">DOCUMENTOS</h1>
            <p className="mt-1 text-sm text-text-muted">
              Gestão central de documentos com filtros por status, tipo e cliente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchDocumentos()}
              disabled={loading}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt disabled:opacity-50"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setMostrarUpload(!mostrarUpload)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <UploadIcon className="h-4 w-4" />
              {mostrarUpload ? 'Ocultar Upload' : 'Upload Documento'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.total}</p>
                <p className="text-sm text-text-muted">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.pendentes}</p>
                <p className="text-sm text-text-muted">Pendentes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.aprovados}</p>
                <p className="text-sm text-text-muted">Aprovados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.rejeitados}</p>
                <p className="text-sm text-text-muted">Rejeitados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Fora do PageState para sempre estar disponível */}
        {mostrarUpload && (
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text">Upload de Documentos</h3>
              <button
                type="button"
                onClick={() => setMostrarUpload(false)}
                className="rounded-lg p-2 text-text-subtle hover:bg-surface-alt hover:text-text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <UploadDocumentos
              casoId={clienteFilter !== 'todos' ? selectedCase?.id : undefined}
              orgId={currentOrg?.id}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        <PageState
          status={pageState}
          emptyTitle="Nenhum documento encontrado"
          emptyDescription="Ajuste os filtros para localizar os documentos."
          emptyAction={emptyAction}
          onRetry={error ? fetchDocumentos : undefined}
        >
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            {/* Edit Section */}
            {editingDoc && (
              <div className="xl:col-span-2 rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-text">Editar documento</h3>
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="rounded-lg p-2 text-text-subtle hover:bg-surface-alt hover:text-text-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Título</label>
                    <input
                      value={docForm.title}
                      onChange={(event) => setDocForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Nome do documento"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Tipo</label>
                    <input
                      value={docForm.type}
                      onChange={(event) => setDocForm((prev) => ({ ...prev, type: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Ex: contrato, procuração"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarEdicao}
                    disabled={savingDoc}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    {savingDoc ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            )}

            {/* Documents Table */}
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <div className="border-b border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-text">Documentos pendentes</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span>Total: {documentos.length}</span>
                      <span>·</span>
                      <span>Exibindo: {filteredDocs.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="border-b border-border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
                  <button
                    type="button"
                    className="text-sm text-text-muted hover:text-text"
                    onClick={resetFilters}
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-surface-alt text-xs font-medium uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="px-4 py-3 w-10" />
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Atualizado</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-surface-alt">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border-strong"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text">{doc.title}</div>
                          <div className="text-xs text-text-muted">{doc.type}</div>
                        </td>
                        <td className="px-4 py-3 text-text">{doc.cliente}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                              statusBadge(doc.status),
                            )}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {formatDateTime(doc.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {canManageDocs ? (
                            <div className="flex items-center gap-1">
                              {/* Botões de visualização do arquivo */}
                              {doc.url && (
                                <>
                                  <button
                                    type="button"
                                    title="Abrir documento"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => void handleAbrirDocumento(doc)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Baixar documento"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-cyan-50 hover:text-cyan-600"
                                    onClick={() => void handleDownloadDocumento(doc)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                title="Marcar como visualizado"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-purple-50 hover:text-purple-600"
                                onClick={() => void handleVisualizar(doc.id, doc.title)}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Validar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-green-50 hover:text-green-600"
                                onClick={() => void handleAprovar(doc.id, doc.title)}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Rejeitar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-red-50 hover:text-red-600"
                                onClick={() => void handleRejeitar(doc.id, doc.title)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Solicitar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => void handleSolicitar(doc.id, doc.title)}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Editar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-surface-alt hover:text-text-muted"
                                onClick={() => handleEditarDocumento(doc)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Excluir"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-red-50 hover:text-red-600"
                                onClick={() => void handleExcluirDocumento(doc.id, doc.title)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-subtle">Sem permissão</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checklist Sidebar */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-text mb-4">Checklist do caso</h3>
              {selectedCase ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-surface-alt p-3">
                    <p className="font-medium text-text">{selectedCase.title}</p>
                    <p className="text-xs text-text-muted mt-1">Cliente: {selectedCase.cliente}</p>
                  </div>
                  {checklistItems.length === 0 ? (
                    <div className="rounded-lg border border-border bg-surface-alt p-3 text-sm text-text-muted">
                      Nenhum documento vinculado ao caso.
                    </div>
                  ) : (
                    checklistItems.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-white p-3"
                      >
                        <span className="text-sm text-text">{doc.title}</span>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            statusBadge(doc.status),
                          )}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-surface-alt p-4 text-sm text-text-muted">
                  Selecione um cliente para visualizar o checklist do caso.
                </div>
              )}
            </div>
          </div>
        </PageState>
      </div>

      {/* Modal Viewer de Documento */}
      <DocumentoViewer
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        url={viewerDoc?.url || ''}
        titulo={viewerDoc?.titulo || ''}
        fileName={viewerDoc?.fileName}
        status={viewerDoc?.status}
        onDownload={viewerDoc ? () => {
          const a = document.createElement('a')
          a.href = viewerDoc.url
          a.download = viewerDoc.fileName || `${viewerDoc.titulo}.pdf`
          a.click()
        } : undefined}
        onAprovar={viewerDoc ? async () => {
          await marcarCompleto(viewerDoc.id)
          toast.success(`Documento aprovado: ${viewerDoc.titulo}`)
          setViewerDoc(prev => prev ? { ...prev, status: 'aprovado' } : null)
        } : undefined}
        onRejeitar={viewerDoc ? async () => {
          await marcarRejeitado(viewerDoc.id)
          toast.success(`Documento rejeitado: ${viewerDoc.titulo}`)
          setViewerDoc(prev => prev ? { ...prev, status: 'rejeitado' } : null)
        } : undefined}
        onSolicitar={viewerDoc ? async () => {
          await solicitarNovamente(viewerDoc.id)
          toast.success(`Solicitado novamente: ${viewerDoc.titulo}`)
          setViewerDoc(prev => prev ? { ...prev, status: 'solicitado' } : null)
        } : undefined}
      />
    </div>
  )
}
