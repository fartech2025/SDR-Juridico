import * as React from 'react'
import { ChevronDown, ChevronLeft, Filter, Search, X, Plus, Pencil, Trash2, UserPlus, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Caso } from '@/types/domain'
import { cn } from '@/utils/cn'
import { useCasos } from '@/hooks/useCasos'
import { useAdvogados } from '@/hooks/useAdvogados'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useOrganization } from '@/hooks/useOrganization'
import { useClientes } from '@/hooks/useClientes'
import type { CasoRow } from '@/lib/supabaseClient'
import { casosService } from '@/services/casosService'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusLabel = (status: Caso['status']) => {
  if (status === 'suspenso') return 'Suspenso'
  if (status === 'encerrado') return 'Encerrado'
  return 'Em andamento'
}

const slaTone = (sla: Caso['slaRisk']) => {
  if (sla === 'critico') return '#ef4444'
  if (sla === 'atencao') return '#f59e0b'
  return '#22c55e'
}

const slaPercentByRisk = (sla: Caso['slaRisk']) => {
  if (sla === 'critico') return 85
  if (sla === 'atencao') return 55
  return 25
}

const areaPill = (area: Caso['area']) => {
  if (area === 'Trabalhista') return 'bg-purple-50 text-purple-700 border-purple-200'
  if (area === 'Previdenciario') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (area === 'Empresarial') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

const heatPill = (heat: Caso['heat']) => {
  if (heat === 'quente') return 'bg-red-50 text-red-700 border-red-200'
  if (heat === 'morno') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

export const CasosPage = () => {
  const { casos, loading, error, fetchCasos, createCaso, updateCaso, deleteCaso, assignCasoAdvogado } = useCasos()
  const { clientes } = useClientes()
  const { displayName } = useCurrentUser()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageCasos = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const { advogados } = useAdvogados(currentOrg?.id || null, canManageCasos)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = resolveStatus(params.get('state'))
  const [query, setQuery] = React.useState('')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [heatFilter, setHeatFilter] = React.useState('todos')
  const [showForm, setShowForm] = React.useState(false)
  const [editingCasoId, setEditingCasoId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [assigningCasoId, setAssigningCasoId] = React.useState<string | null>(null)
  const [selectedCasoAdvogadoId, setSelectedCasoAdvogadoId] = React.useState('')

  const initialFormData = React.useMemo(() => ({
    titulo: '',
    descricao: '',
    clienteId: '',
    area: '',
    status: 'ativo' as CasoRow['status'],
    prioridade: 'media' as CasoRow['prioridade'],
    stage: 'triagem' as CasoRow['stage'],
    valor: '',
  }), [])

  const [formData, setFormData] = React.useState(initialFormData)
  const isEditing = Boolean(editingCasoId)

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return casos.filter((caso) => {
      const matchesQuery =
        !term ||
        caso.cliente.toLowerCase().includes(term) ||
        caso.area.toLowerCase().includes(term)
      const matchesArea = areaFilter === 'todos' || caso.area === areaFilter
      const matchesHeat = heatFilter === 'todos' || caso.heat === heatFilter
      return matchesQuery && matchesArea && matchesHeat
    })
  }, [query, areaFilter, heatFilter, casos])

  const resetCasoForm = () => {
    setFormData(initialFormData)
    setEditingCasoId(null)
  }

  const handleEditCaso = async (casoId: string) => {
    if (!canManageCasos) {
      toast.error('Apenas gestores podem editar casos.')
      return
    }
    setSaving(true)
    try {
      const caso = await casosService.getCaso(casoId)
      setFormData({
        titulo: caso.titulo,
        descricao: caso.descricao || '',
        clienteId: caso.cliente_id || '',
        area: caso.area || '',
        status: caso.status,
        prioridade: caso.prioridade,
        stage: caso.stage || 'triagem',
        valor: caso.valor ? String(caso.valor) : '',
      })
      setEditingCasoId(casoId)
      setShowForm(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar caso'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCaso = async (casoId: string, titulo: string) => {
    if (!canManageCasos) {
      toast.error('Apenas gestores podem excluir casos.')
      return
    }
    const confirmed = window.confirm(`Excluir o caso "${titulo}"? Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    try {
      await deleteCaso(casoId)
      toast.success(`Caso excluído: ${titulo}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir caso'
      toast.error(message)
    }
  }

  const handleEncaminharCaso = async (casoId: string) => {
    if (!selectedCasoAdvogadoId) {
      toast.error('Selecione um advogado para encaminhar.')
      return
    }
    const advogado = advogados.find((item) => item.id === selectedCasoAdvogadoId)
    if (!advogado) {
      toast.error('Advogado nao encontrado.')
      return
    }
    try {
      await assignCasoAdvogado(casoId, advogado.id)
      toast.success(`Caso encaminhado para ${advogado.nome}`)
      setAssigningCasoId(null)
      setSelectedCasoAdvogadoId('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encaminhar caso'
      toast.error(message)
    }
  }

  const handleSaveCaso = async () => {
    if (!canManageCasos) {
      toast.error('Apenas gestores podem adicionar casos.')
      return
    }
    if (!formData.titulo) {
      toast.error('Informe o titulo do caso.')
      return
    }

    setSaving(true)
    try {
      const payload: Omit<CasoRow, 'id' | 'created_at' | 'updated_at' | 'org_id'> = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        cliente_id: formData.clienteId || null,
        lead_id: null,
        area: formData.area || 'Geral',
        status: formData.status,
        prioridade: formData.prioridade,
        heat: null,
        stage: formData.stage || null,
        valor: formData.valor ? Number(formData.valor) : null,
        sla_risk: null,
        tags: null,
        responsavel: null,
        data_abertura: null,
        data_encerramento: null,
      }

      if (editingCasoId) {
        await updateCaso(editingCasoId, payload)
        toast.success('Caso atualizado com sucesso.')
      } else {
        await createCaso(payload)
        toast.success('Caso criado com sucesso.')
      }
      resetCasoForm()
      setShowForm(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar caso'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filtered.length
        ? 'ready'
        : 'empty'
  const pageState = status !== 'ready' ? status : baseState
  const emptyAction = canManageCasos ? (
    <Button
      variant="primary"
      size="sm"
      onClick={() => {
        resetCasoForm()
        setShowForm(true)
      }}
    >
      <Plus className="mr-2 h-4 w-4" />
      Novo caso
    </Button>
  ) : null

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editar Caso' : 'Novo Caso'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Atualize os dados do caso' : 'Preencha os dados do novo caso'}
              </p>
            </div>
            <Button onClick={() => { resetCasoForm(); setShowForm(false) }} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Titulo *</label>
                  <input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    placeholder="Titulo do caso"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Sem cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Area</label>
                  <input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    placeholder="Ex: Trabalhista"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CasoRow['status'] })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as CasoRow['prioridade'] })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={formData.stage || ''}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as CasoRow['stage'] })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="triagem">Triagem</option>
                    <option value="negociacao">Negociacao</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="conclusao">Conclusao</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Valor estimado</label>
                  <input
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Descricao</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2"
                    placeholder="Descricao do caso"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveCaso}
                  disabled={saving}
                  className="flex-1 h-10 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#721011' }}
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar Caso'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetCasoForm(); setShowForm(false) }}
                  className="px-6 h-10 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          input:focus, select:focus, textarea:focus {
            --tw-ring-color: #721011;
            border-color: #721011;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: '#721011' }}
                >
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gestão de Casos
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Casos</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie todos os casos jurídicos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void fetchCasos()}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Atualizar
              </button>
              <button
                onClick={() => {
                  if (!canManageCasos) {
                    toast.error('Apenas gestores podem adicionar casos.')
                    return
                  }
                  resetCasoForm()
                  setShowForm(true)
                }}
                disabled={!canManageCasos}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#721011' }}
              >
                <Plus className="inline mr-2 h-4 w-4" />
                Novo Caso
              </button>
            </div>
          </div>
        </div>

        <Card className="border border-gray-100 bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar casos..."
                  className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#721011' } as React.CSSProperties}
                />
              </div>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              >
                <option value="todos">Todas as áreas</option>
                {Array.from(new Set(casos.map((caso) => caso.area))).map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <select
                value={heatFilter}
                onChange={(e) => setHeatFilter(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2"
              >
                <option value="todos">Temperatura</option>
                {Array.from(new Set(casos.map((caso) => caso.heat))).map((heat) => (
                  <option key={heat} value={heat}>{heat}</option>
                ))}
              </select>
            </div>

            <PageState
              status={pageState}
              emptyTitle="Nenhum caso encontrado"
              emptyDescription="Ajuste os filtros para localizar um caso."
              emptyAction={emptyAction}
              onRetry={error ? fetchCasos : undefined}
            >
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Area juridica</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Calor</th>
                      <th className="px-4 py-3">SLA</th>
                      <th className="px-4 py-3 text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((caso) => {
                      const percent = slaPercentByRisk(caso.slaRisk)
                      const initials = caso.cliente
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                      return (
                        <React.Fragment key={caso.id}>
                          <tr
                            className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/app/caso/${caso.id}`)}
                          >
                            <td className="px-4 py-3 text-xs text-gray-500">
                              #{caso.id.replace('caso-', '')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: '#721011' }}
                                >
                                  {initials}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{caso.cliente}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', areaPill(caso.area))}>
                                {caso.area}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">{statusLabel(caso.status)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', heatPill(caso.heat))}>
                                {caso.heat}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full"
                                    style={{ width: `${percent}%`, backgroundColor: slaTone(caso.slaRisk) }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{percent}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {canManageCasos && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); void handleEditCaso(caso.id) }}
                                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                                    >
                                      <Pencil className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); void handleDeleteCaso(caso.id, caso.title) }}
                                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {canManageCasos && assigningCasoId === caso.id && (
                            <tr className="border-t border-gray-100 bg-gray-50">
                              <td colSpan={7} className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                  <span className="text-xs font-medium text-gray-700">Encaminhar para</span>
                                  <select
                                    className="h-8 rounded-lg border border-gray-200 px-3 text-xs bg-white"
                                    value={selectedCasoAdvogadoId}
                                    onChange={(e) => setSelectedCasoAdvogadoId(e.target.value)}
                                  >
                                    <option value="">Selecione um advogado</option>
                                    {advogados.map((advogado) => (
                                      <option key={advogado.id} value={advogado.id}>{advogado.nome}</option>
                                    ))}
                                  </select>
                                  <button
                                    className="h-8 px-4 rounded-lg text-xs font-medium text-white"
                                    style={{ backgroundColor: '#721011' }}
                                    onClick={() => void handleEncaminharCaso(caso.id)}
                                  >
                                    Encaminhar
                                  </button>
                                  <button
                                    className="h-8 px-4 rounded-lg border border-gray-200 text-xs font-medium text-gray-700"
                                    onClick={() => { setAssigningCasoId(null); setSelectedCasoAdvogadoId('') }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </PageState>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input:focus, select:focus { --tw-ring-color: #721011; border-color: #721011; }
      `}</style>
    </div>
  )
}
