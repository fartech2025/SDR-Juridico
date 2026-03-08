import * as React from 'react'
import { Check, Plus, X, Upload as UploadIcon, Pencil, Trash2, FileText, Clock, CheckCircle, AlertCircle, Eye, ExternalLink, Download, HardDrive, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams, useLocation } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { PageHeader } from '@/components/ui'
import { UploadDocumentos } from '@/components/UploadDocumentos'
import { DocumentoViewer } from '@/components/DocumentoViewer'
import { formatDateTime } from '@/utils/format'
import type { Documento } from '@/types/domain'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useCasos } from '@/hooks/useCasos'
import { useOrganization } from '@/hooks/useOrganization'
import { cn } from '@/utils/cn'

// ── tipos de status do Drive ──────────────────────────────────────────────────
type DriveStatus = 'checking' | 'connected' | 'scope_missing' | 'not_connected'
type DriveProvider = 'google_drive' | 'onedrive' | null

// ── helpers ───────────────────────────────────────────────────────────────────
const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') return value
  return 'ready'
}

const statusBadge = (status: Documento['status']) => {
  if (status === 'aprovado' || status === 'completo') return 'bg-green-100 text-green-700'
  if (status === 'solicitado') return 'bg-blue-100 text-blue-700'
  if (status === 'rejeitado') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

// ── DriveStatusBanner ─────────────────────────────────────────────────────────
function DriveStatusBanner({
  driveStatus,
  driveProvider,
  onConnect,
  onRecheck,
}: {
  driveStatus: DriveStatus
  driveProvider: DriveProvider
  onConnect: () => void
  onRecheck: () => void
}) {
  if (driveStatus === 'checking') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-text-muted">Verificando conexão com Drive...</span>
      </div>
    )
  }

  if (driveStatus === 'connected') {
    const label = driveProvider === 'onedrive' ? 'OneDrive' : 'Google Drive'
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
          <div>
            <p className="text-sm font-semibold text-green-800">{label} conectado</p>
            <p className="text-xs text-green-700">Documentos enviados e gerados serão salvos no seu Drive</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRecheck}
          title="Verificar novamente"
          className="shrink-0 rounded-lg p-1.5 text-green-600 hover:bg-green-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (driveStatus === 'scope_missing') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Google Drive sem permissão de acesso</p>
            <p className="text-xs text-amber-700">Reconecte o Google Drive para liberar o armazenamento de documentos</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
        >
          Reconectar Drive
        </button>
      </div>
    )
  }

  // not_connected
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-5 py-3 shadow-sm"
      style={{ borderColor: '#f0e8e8', background: 'linear-gradient(135deg, #fdf8f8 0%, #f9f0f0 100%)' }}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #4A0B0C, #721011)' }}>
          <HardDrive className="h-4 w-4" style={{ color: '#e8c97a' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Google Drive não conectado</p>
          <p className="text-xs text-text-muted">Conecte o Drive para enviar e gerar documentos no sistema</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRecheck}
          title="Verificar novamente"
          className="rounded-lg p-1.5 text-text-muted hover:bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onConnect}
          className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #4A0B0C, #721011)' }}
        >
          Conectar Google Drive
        </button>
      </div>
    </div>
  )
}

// ── DocumentosPage ────────────────────────────────────────────────────────────
export const DocumentosPage = () => {
  const {
    documentos, loading, error, fetchDocumentos, updateDocumento, deleteDocumento,
    marcarCompleto, marcarRejeitado, marcarVisualizado, solicitarNovamente,
    abrirDocumento, downloadDocumento,
  } = useDocumentos()
  const { casos } = useCasos()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const location = useLocation()
  const canManageDocs = isFartechAdmin || ['org_admin', 'gestor', 'admin', 'advogado', 'estagiario', 'secretaria'].includes(currentRole || '') || !!currentOrg
  const [params] = useSearchParams()

  // ── Drive status ───────────────────────────────────────────────────────────
  const [driveStatus,   setDriveStatus]   = React.useState<DriveStatus>('checking')
  const [driveProvider, setDriveProvider] = React.useState<DriveProvider>(null)

  const checkDrive = React.useCallback(async () => {
    setDriveStatus('checking')
    try {
      const { driveService } = await import('@/services/driveService')
      // Testa Google Drive com status detalhado
      const googleStatus = await driveService.checkGoogleStatus()
      if (googleStatus === 'connected') { setDriveStatus('connected'); setDriveProvider('google_drive'); return }
      if (googleStatus === 'scope_missing') { setDriveStatus('scope_missing'); setDriveProvider('google_drive'); return }
      // Testa OneDrive
      const onedriveOk = await driveService.isConnected('onedrive')
      if (onedriveOk) { setDriveStatus('connected'); setDriveProvider('onedrive'); return }
      setDriveStatus('not_connected')
      setDriveProvider(null)
    } catch {
      setDriveStatus('not_connected')
      setDriveProvider(null)
    }
  }, [])

  React.useEffect(() => { void checkDrive() }, [checkDrive])

  // Detecta retorno do OAuth (?google_drive=connected)
  React.useEffect(() => {
    const gd = new URLSearchParams(location.search).get('google_drive')
    if (gd === 'connected') {
      toast.success('Google Drive conectado com sucesso!')
      window.history.replaceState({}, '', '/app/documentos')
      void checkDrive()
    }
    if (gd === 'error') {
      toast.error('Falha ao conectar o Google Drive.')
      window.history.replaceState({}, '', '/app/documentos')
    }
  }, [location.search, checkDrive])

  const handleConnectGoogleDrive = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
    if (!supabaseUrl || !currentOrg?.id) { toast.error('Configuração incompleta'); return }
    const returnTo  = `${window.location.origin}/app/documentos`
    const oauthUrl  = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/google-drive-oauth`)
    oauthUrl.searchParams.set('org_id',    currentOrg.id)
    oauthUrl.searchParams.set('return_to', returnTo)
    window.location.href = oauthUrl.toString()
  }

  // ── filtros & stats ────────────────────────────────────────────────────────
  const [statusFilter,  setStatusFilter]  = React.useState('todos')
  const [typeFilter,    setTypeFilter]    = React.useState('todos')
  const [clienteFilter, setClienteFilter] = React.useState('todos')
  const [mostrarUpload, setMostrarUpload] = React.useState(false)
  const [editingDoc,    setEditingDoc]    = React.useState<Documento | null>(null)
  const [docForm,       setDocForm]       = React.useState({ title: '', type: '' })
  const [savingDoc,     setSavingDoc]     = React.useState(false)
  const [viewerDoc,     setViewerDoc]     = React.useState<{
    id: string; url: string; titulo: string; fileName?: string; status: Documento['status']
  } | null>(null)

  const filters = React.useMemo(() => ({
    status:  Array.from(new Set(documentos.map(d => d.status))),
    type:    Array.from(new Set(documentos.map(d => d.type))),
    cliente: Array.from(new Set(documentos.map(d => d.cliente))),
  }), [documentos])

  const filteredDocs = React.useMemo(() => documentos.filter(doc => {
    const matchesStatus  = statusFilter  === 'todos' || doc.status   === statusFilter
    const matchesType    = typeFilter    === 'todos' || doc.type     === typeFilter
    const matchesCliente = clienteFilter === 'todos' || doc.cliente  === clienteFilter
    return matchesStatus && matchesType && matchesCliente
  }), [statusFilter, typeFilter, clienteFilter, documentos])

  const stats = React.useMemo(() => ({
    total:     documentos.length,
    pendentes: documentos.filter(d => d.status === 'pendente' || d.status === 'solicitado').length,
    aprovados: documentos.filter(d => d.status === 'aprovado' || d.status === 'completo').length,
    rejeitados: documentos.filter(d => d.status === 'rejeitado').length,
  }), [documentos])

  const forcedState = resolveStatus(params.get('state'))
  const baseState   = loading ? 'loading' : error ? 'error' : filteredDocs.length === 0 ? 'empty' : 'ready'
  const pageState   = forcedState !== 'ready' ? forcedState : baseState

  const emptyAction = canManageDocs ? (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => setMostrarUpload(true)}
    >
      <UploadIcon className="h-4 w-4" />
      Upload documento
    </button>
  ) : null

  const selectedCase   = clienteFilter !== 'todos' ? casos.find(c => c.cliente === clienteFilter) : undefined
  const checklistItems = selectedCase ? documentos.filter(d => d.casoId === selectedCase.id) : []

  const resetFilters = () => { setStatusFilter('todos'); setTypeFilter('todos'); setClienteFilter('todos') }

  const handleUploadComplete = () => {
    toast.success('Documento enviado com sucesso!')
    void fetchDocumentos()
    setTimeout(() => setMostrarUpload(false), 1500)
  }

  const handleAprovar  = async (id: string, t: string) => { try { await marcarCompleto(id);     toast.success(`Documento aprovado: ${t}`) } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao aprovar') } }
  const handleRejeitar = async (id: string, t: string) => { try { await marcarRejeitado(id);    toast.success(`Documento rejeitado: ${t}`) } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao rejeitar') } }
  const handleSolicitar = async (id: string, t: string) => { try { await solicitarNovamente(id); toast.success(`Solicitado novamente: ${t}`) } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro') } }
  const handleVisualizar = async (id: string, t: string) => { try { await marcarVisualizado(id); toast.success(`Marcado como visualizado: ${t}`) } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro') } }

  const handleAbrirDocumento = async (doc: Documento) => {
    if (!doc.url) { toast.error('Este documento não possui arquivo anexado'); return }
    try {
      const url = await abrirDocumento(doc.url)
      setViewerDoc({ id: doc.id, url, titulo: doc.title, fileName: doc.fileName, status: doc.status })
      await marcarVisualizado(doc.id)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao abrir documento') }
  }

  const handleDownloadDocumento = async (doc: Documento) => {
    if (!doc.url) { toast.error('Este documento não possui arquivo anexado'); return }
    try {
      await downloadDocumento(doc.url, doc.fileName || `${doc.title}.pdf`)
      toast.success(`Download iniciado: ${doc.title}`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao baixar') }
  }

  const resetEditForm = () => { setEditingDoc(null); setDocForm({ title: '', type: '' }) }

  const handleEditarDocumento = (doc: Documento) => {
    if (!canManageDocs) { toast.error('Apenas gestores podem editar documentos.'); return }
    setEditingDoc(doc)
    setDocForm({ title: doc.title, type: doc.type })
    setMostrarUpload(false)
  }

  const handleSalvarEdicao = async () => {
    if (!editingDoc) return
    setSavingDoc(true)
    try {
      await updateDocumento(editingDoc.id, { titulo: docForm.title || editingDoc.title, tipo: docForm.type || editingDoc.type })
      toast.success(`Documento atualizado: ${editingDoc.title}`)
      void fetchDocumentos()
      resetEditForm()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao atualizar') }
    finally { setSavingDoc(false) }
  }

  const handleExcluirDocumento = async (docId: string, titulo: string) => {
    if (!canManageDocs) { toast.error('Apenas gestores podem excluir documentos.'); return }
    const confirmed = window.confirm(`Excluir o documento "${titulo}"? Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    try {
      await deleteDocumento(docId)
      toast.success(`Documento excluído: ${titulo}`)
      void fetchDocumentos()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  return (
    <div className="min-h-screen bg-surface-alt p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">

        {/* Header */}
        <PageHeader
          icon={FileText}
          eyebrow="Conteúdo"
          title="Documentos"
          subtitle="Gestão central de documentos com filtros por status, tipo e cliente."
          actions={
            <>
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
            </>
          }
        />

        {/* Drive Status Banner */}
        <DriveStatusBanner
          driveStatus={driveStatus}
          driveProvider={driveProvider}
          onConnect={handleConnectGoogleDrive}
          onRecheck={() => void checkDrive()}
        />

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

        {/* Upload Section */}
        {mostrarUpload && (
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-text">Upload de Documentos</h3>
                {driveStatus !== 'connected' && driveStatus !== 'checking' && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <AlertCircle className="h-3 w-3" />
                    Drive não conectado
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMostrarUpload(false)}
                className="rounded-lg p-2 text-text-subtle hover:bg-surface-alt hover:text-text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {driveStatus === 'not_connected' || driveStatus === 'scope_missing' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <HardDrive className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm font-semibold text-amber-800 mb-1">Drive necessário para upload</p>
                <p className="text-xs text-amber-700 mb-3">
                  {driveStatus === 'scope_missing'
                    ? 'Reconecte o Google Drive com permissão de armazenamento.'
                    : 'Conecte o Google Drive para armazenar documentos na sua conta.'}
                </p>
                <button
                  type="button"
                  onClick={handleConnectGoogleDrive}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #4A0B0C, #721011)' }}
                >
                  {driveStatus === 'scope_missing' ? 'Reconectar Google Drive' : 'Conectar Google Drive'}
                </button>
              </div>
            ) : (
              <UploadDocumentos
                casoId={clienteFilter !== 'todos' ? selectedCase?.id : undefined}
                orgId={currentOrg?.id}
                onUploadComplete={handleUploadComplete}
              />
            )}
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
                  <button type="button" onClick={resetEditForm} className="rounded-lg p-2 text-text-subtle hover:bg-surface-alt hover:text-text-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Título</label>
                    <input
                      value={docForm.title}
                      onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Nome do documento"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Tipo</label>
                    <input
                      value={docForm.type}
                      onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Ex: contrato, procuração"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button type="button" onClick={resetEditForm} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt">Cancelar</button>
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
                  <select className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="todos">Status</option>
                    {filters.status.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="todos">Tipo</option>
                    {filters.type.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" value={clienteFilter} onChange={e => setClienteFilter(e.target.value)}>
                    <option value="todos">Cliente</option>
                    {filters.cliente.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" className="text-sm text-text-muted hover:text-text" onClick={resetFilters}>Limpar filtros</button>
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
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-surface-alt">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="h-4 w-4 rounded border-border-strong" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-text">{doc.title}</div>
                            {/* Ícone Drive quando o arquivo está no Drive */}
                            {doc.url?.startsWith('https://') && (
                              <HardDrive className="h-3 w-3 text-green-500 shrink-0" aria-label="Salvo no Drive" />
                            )}
                          </div>
                          <div className="text-xs text-text-muted">{doc.type}</div>
                        </td>
                        <td className="px-4 py-3 text-text">{doc.cliente}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusBadge(doc.status))}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">{formatDateTime(doc.updatedAt)}</td>
                        <td className="px-4 py-3">
                          {canManageDocs ? (
                            <div className="flex items-center gap-1">
                              {doc.url && (
                                <>
                                  <button type="button" title="Abrir documento" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-blue-50 hover:text-blue-600" onClick={() => void handleAbrirDocumento(doc)}>
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                  <button type="button" title="Baixar documento" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-cyan-50 hover:text-cyan-600" onClick={() => void handleDownloadDocumento(doc)}>
                                    <Download className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button type="button" title="Marcar como visualizado" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-purple-50 hover:text-purple-600" onClick={() => void handleVisualizar(doc.id, doc.title)}>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button type="button" title="Validar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-green-50 hover:text-green-600" onClick={() => void handleAprovar(doc.id, doc.title)}>
                                <Check className="h-4 w-4" />
                              </button>
                              <button type="button" title="Rejeitar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-red-50 hover:text-red-600" onClick={() => void handleRejeitar(doc.id, doc.title)}>
                                <X className="h-4 w-4" />
                              </button>
                              <button type="button" title="Solicitar novamente" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-blue-50 hover:text-blue-600" onClick={() => void handleSolicitar(doc.id, doc.title)}>
                                <Plus className="h-4 w-4" />
                              </button>
                              <button type="button" title="Editar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-surface-alt hover:text-text-muted" onClick={() => handleEditarDocumento(doc)}>
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" title="Excluir" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-red-50 hover:text-red-600" onClick={() => void handleExcluirDocumento(doc.id, doc.title)}>
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
                    <div className="rounded-lg border border-border bg-surface-alt p-3 text-sm text-text-muted">Nenhum documento vinculado ao caso.</div>
                  ) : (
                    checklistItems.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                        <span className="text-sm text-text">{doc.title}</span>
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusBadge(doc.status))}>
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

      {/* Modal Viewer */}
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
        onAprovar={viewerDoc ? async () => { await marcarCompleto(viewerDoc.id); toast.success(`Aprovado: ${viewerDoc.titulo}`); setViewerDoc(p => p ? { ...p, status: 'aprovado' } : null) } : undefined}
        onRejeitar={viewerDoc ? async () => { await marcarRejeitado(viewerDoc.id); toast.success(`Rejeitado: ${viewerDoc.titulo}`); setViewerDoc(p => p ? { ...p, status: 'rejeitado' } : null) } : undefined}
        onSolicitar={viewerDoc ? async () => { await solicitarNovamente(viewerDoc.id); toast.success(`Solicitado novamente: ${viewerDoc.titulo}`); setViewerDoc(p => p ? { ...p, status: 'solicitado' } : null) } : undefined}
      />
    </div>
  )
}
