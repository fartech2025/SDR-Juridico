import * as React from 'react'
import { Check, Plus, X, Upload as UploadIcon } from 'lucide-react'
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
import { useTheme } from '@/contexts/ThemeContext'
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
  if (status === 'aprovado') return 'border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]'
  if (status === 'solicitado') return 'border-[#D6E4FF] bg-[#E6F0FF] text-[#1D4ED8]'
  if (status === 'rejeitado') return 'border-[#F5C2C2] bg-[#FFE1E1] text-[#B42318]'
  return 'border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]'
}

export const DocumentosPage = () => {
  const { documentos, loading, error } = useDocumentos()
  const { casos } = useCasos()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [params] = useSearchParams()
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [typeFilter, setTypeFilter] = React.useState('todos')
  const [clienteFilter, setClienteFilter] = React.useState('todos')
  const [activeTab, setActiveTab] = React.useState('Tudo')
  const [mostrarUpload, setMostrarUpload] = React.useState(false)

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

  return (
    <div
      className={cn(
        'min-h-screen pb-12',
        isDark ? 'bg-[#0e1116] text-slate-100' : 'bg-[#fff6e9] text-[#1d1d1f]',
      )}
    >
      <div className="space-y-5">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(199,98,0,0.8)]',
            isDark
              ? 'border-slate-800 bg-gradient-to-br from-[#141820] via-[#10141b] to-[#0b0f14]'
              : 'border-[#f3c988] bg-gradient-to-br from-[#ffedd5] via-[#fff3e0] to-[#f7caaa]',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              isDark ? 'opacity-20' : 'opacity-80',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-xs uppercase tracking-[0.3em]',
                isDark ? 'text-emerald-200' : 'text-[#9a5b1e]',
              )}
            >
              Documentos
            </p>
            <h2 className={cn('font-display text-2xl', isDark ? 'text-slate-100' : 'text-[#2a1400]')}>
              Gestao central
            </h2>
            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-[#7a4a1a]')}>
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
                isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
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
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          )}

          <Card
            className={cn(
              'border',
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
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
                  onClick={() => setMostrarUpload(!mostrarUpload)}
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  {mostrarUpload ? 'Ocultar Upload' : 'Upload Documento'}
                </Button>
                <Button variant="outline" size="sm" className="h-10 rounded-full px-4">
                  Nova solicitacao
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-soft',
                  isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white',
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
                          ? isDark
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                            : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600'
                          : isDark
                            ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                            : 'border-[#f0d9b8] bg-white text-[#7a4a1a] hover:bg-[#fff3e0] hover:text-[#2a1400]'
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
                    className={cn(
                      'h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2',
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
                    )}
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
                    className={cn(
                      'h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2',
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
                    )}
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
                    className={cn(
                      'h-11 rounded-full border px-4 text-sm shadow-soft focus:outline-none focus:ring-2',
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-[#f0d9b8] bg-white text-[#2a1400] focus:border-emerald-400 focus:ring-emerald-200',
                    )}
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
                    isDark ? 'text-slate-300 hover:text-slate-100' : 'text-[#7a4a1a] hover:text-[#2a1400]',
                  )}
                  onClick={resetFilters}
                >
                  Limpar filtros
                </button>
              </div>

              <div
                className={cn(
                  'overflow-hidden rounded-2xl border shadow-soft',
                  isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white',
                )}
              >
                <table className="w-full border-collapse text-left text-sm">
                  <thead
                    className={cn(
                      'text-[11px] uppercase tracking-[0.22em]',
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#fff3e0] text-[#9a5b1e]',
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
                          'border-t text-text',
                          isDark
                            ? 'border-slate-800 hover:bg-slate-800/60'
                            : 'border-[#f0d9b8] hover:bg-[#fff3e0]/60',
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
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <button
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1',
                                isDark ? 'text-slate-300 hover:text-success' : 'text-[#7a4a1a] hover:text-success',
                              )}
                              onClick={(event) => {
                                event.stopPropagation()
                                toast.success(`Documento aprovado: ${doc.title}`)
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Validar
                            </button>
                            <button
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1',
                                isDark ? 'text-slate-300 hover:text-danger' : 'text-[#7a4a1a] hover:text-danger',
                              )}
                              onClick={(event) => {
                                event.stopPropagation()
                                toast.error(`Documento rejeitado: ${doc.title}`)
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                              Rejeitar
                            </button>
                            <button
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1',
                                isDark ? 'text-slate-300 hover:text-primary' : 'text-[#7a4a1a] hover:text-primary',
                              )}
                              onClick={(event) => {
                                event.stopPropagation()
                                toast.message(`Solicitado novamente: ${doc.title}`)
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Solicitar
                            </button>
                          </div>
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
              isDark ? 'border-slate-800 bg-slate-900/70' : 'border-[#f0d9b8] bg-white/95',
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
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
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
                        isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
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
                        isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
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
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-[#f0d9b8] bg-white',
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
