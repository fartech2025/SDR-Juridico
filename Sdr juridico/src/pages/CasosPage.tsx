import * as React from 'react'
import { ChevronDown, ChevronLeft, Filter, Search, X, Plus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'

import heroLight from '@/assets/hero-light.svg'
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
  if (sla === 'critico') return 'bg-danger'
  if (sla === 'atencao') return 'bg-warning'
  return 'bg-success'
}

const slaPercentByRisk = (sla: Caso['slaRisk']) => {
  if (sla === 'critico') return 85
  if (sla === 'atencao') return 55
  return 25
}

const areaPill = (area: Caso['area']) => {
  if (area === 'Trabalhista') {
    return 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary'
  }
  if (area === 'Previdenciario') {
    return 'border-info-border bg-info-bg text-info'
  }
  if (area === 'Empresarial') {
    return 'border-brand-secondary-subtle bg-brand-secondary-subtle text-brand-secondary'
  }
  return 'border-border bg-surface-2 text-text-muted'
}

const heatPill = (heat: Caso['heat']) => {
  if (heat === 'quente') {
    return 'border-danger-border bg-danger-bg text-danger'
  }
  if (heat === 'morno') {
    return 'border-warning-border bg-warning-bg text-warning'
  }
  return 'border-info-border bg-info-bg text-info'
}

const appShellClass = 'min-h-screen bg-base text-text pb-12'
const heroCardClass =
  'relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt p-8 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]'
const formControlClass =
  'h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text shadow-sm placeholder:text-text-subtle transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const textareaControlClass =
  'min-h-[120px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-sm placeholder:text-text-subtle transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const labelClass = 'text-sm font-semibold text-text'

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

  const chips = [
    { id: 'chip-1', label: 'Trabalhista', tone: 'border-brand-secondary bg-brand-secondary-subtle text-brand-secondary' },
    { id: 'chip-2', label: 'Quente', tone: 'border-danger-border bg-danger-bg text-danger' },
    { id: 'chip-3', label: 'Empresarial', tone: 'border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary' },
    { id: 'chip-4', label: 'e-mails', tone: 'border-info-border bg-info-bg text-info' },
  ]

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
      className="h-9 rounded-full px-4"
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
      <div className={appShellClass}>
        <div className="space-y-6">
          <header className={heroCardClass}>
            <div
              className={cn(
                'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
                'opacity-90',
              )}
              style={{ backgroundImage: `url(${heroLight})` }}
            />
            <div className="relative z-10">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded-full p-2', 'bg-brand-secondary/20')}>
                      <Plus className={cn('h-5 w-5', 'text-brand-secondary')} />
                    </div>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-[0.3em]',
                        'text-brand-secondary',
                      )}
                    >
                      {isEditing ? 'Editar caso' : 'Novo caso'}
                    </p>
                  </div>
                  <h2 className={cn('font-display text-4xl font-bold', 'text-text')}>
                    {isEditing ? 'Atualizar caso' : 'Cadastrar caso'}
                  </h2>
                  <p className={cn('text-base', 'text-text-muted')}>
                    {isEditing ? 'Atualize os dados e salve as alteracoes.' : 'Preencha os dados para criar um novo caso.'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    resetCasoForm()
                    setShowForm(false)
                  }}
                  variant="outline"
                  className={cn(
                    'h-14 rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105',
                    'border-border hover:bg-surface-2',
                  )}
                >
                  Voltar
                </Button>
              </div>
            </div>
          </header>

          <Card
            className={cn(
              'border',
              'border-border bg-surface/90',
            )}
          >
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>
                    Titulo *
                  </label>
                  <input
                    value={formData.titulo}
                    onChange={(event) => setFormData({ ...formData, titulo: event.target.value })}
                    className={formControlClass}
                    placeholder="Titulo do caso"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Cliente
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(event) => setFormData({ ...formData, clienteId: event.target.value })}
                    className={formControlClass}
                  >
                    <option value="">Sem cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Area
                  </label>
                  <input
                    value={formData.area}
                    onChange={(event) => setFormData({ ...formData, area: event.target.value })}
                    className={formControlClass}
                    placeholder="Ex: Trabalhista"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(event) => setFormData({ ...formData, status: event.target.value as CasoRow['status'] })}
                    className={formControlClass}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(event) => setFormData({ ...formData, prioridade: event.target.value as CasoRow['prioridade'] })}
                    className={formControlClass}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Etapa
                  </label>
                  <select
                    value={formData.stage || ''}
                    onChange={(event) => setFormData({ ...formData, stage: event.target.value as CasoRow['stage'] })}
                    className={formControlClass}
                  >
                    <option value="triagem">Triagem</option>
                    <option value="negociacao">Negociacao</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="conclusao">Conclusao</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Valor estimado
                  </label>
                  <input
                    type="number"
                    value={formData.valor}
                    onChange={(event) => setFormData({ ...formData, valor: event.target.value })}
                    className={formControlClass}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>
                    Descricao
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(event) => setFormData({ ...formData, descricao: event.target.value })}
                    className={textareaControlClass}
                    placeholder="Descricao do caso"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetCasoForm()
                    setShowForm(false)
                  }}
                  className={cn(
                    'h-12 rounded-xl border-2 px-6 text-sm font-semibold',
                    'border-border hover:bg-surface-2',
                  )}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveCaso}
                  className={cn(
                    'h-12 rounded-xl px-8 text-sm font-semibold shadow-lg',
                    'bg-gradient-to-r from-brand-secondary to-brand-accent hover:from-brand-secondary-dark hover:to-brand-accent-dark',
                  )}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar caso'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={appShellClass}>
      <div className="space-y-6">
        <header className={cn(heroCardClass, 'p-6')}>
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              'opacity-90',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <div className={cn('flex items-center gap-3 text-sm', 'text-text-muted')}>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  'border-border bg-white',
                )}
              >
                <ChevronLeft className={cn('h-4 w-4', 'text-text-muted')} />
              </span>
              <span>Bom dia, {displayName}</span>
            </div>
            <h2 className={cn('font-display text-2xl', 'text-text')}>
              Casos
            </h2>
          </div>
        </header>

        <Card
          className={cn(
            'border',
            'border-border bg-surface/90',
          )}
        >
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar casos..."
                  className={cn(
                    'h-11 w-full rounded-full border border-border bg-white pl-10 pr-3 text-sm text-text placeholder:text-text-subtle shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15',
                  )}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4 text-sm"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-soft',
              'border-border bg-white',
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                    chip.tone,
                  )}
                >
                  {chip.label}
                  <X className="h-3 w-3 text-current/70" />
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  'ml-2 text-xs',
                  'text-text-muted hover:text-text',
                )}
                onClick={() => {
                  setQuery('')
                  setAreaFilter('todos')
                  setHeatFilter('todos')
                }}
              >
                Limpar filtros
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4 text-sm"
                onClick={() => {
                  void fetchCasos()
                }}
                disabled={loading}
              >
                Atualizar
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-11 rounded-full bg-brand-secondary px-5 text-sm font-semibold text-white shadow-[0_12px_20px_-12px_rgba(6,182,212,0.5)] hover:brightness-95"
                onClick={() => {
                  if (!canManageCasos) {
                    toast.error('Apenas gestores podem adicionar casos.')
                    return
                  }
                  resetCasoForm()
                  setShowForm(true)
                }}
                disabled={!canManageCasos}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Caso
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="ml-auto flex items-center gap-2 text-xs text-text-subtle">
              <span>Area</span>
              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                className={cn(
                  'h-8 rounded-full border px-3 text-xs shadow-soft','border-border bg-white text-text',
                )}
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(casos.map((caso) => caso.area))).map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <span>Calor</span>
              <select
                value={heatFilter}
                onChange={(event) => setHeatFilter(event.target.value)}
                className={cn(
                  'h-8 rounded-full border px-3 text-xs shadow-soft','border-border bg-white text-text',
                )}
              >
                <option value="todos">Todos</option>
                {Array.from(new Set(casos.map((caso) => caso.heat))).map((heat) => (
                  <option key={heat} value={heat}>
                    {heat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PageState
            status={pageState}
            emptyTitle="Nenhum caso encontrado"
            emptyDescription="Ajuste os filtros para localizar um caso."
            emptyAction={emptyAction}
            onRetry={error ? fetchCasos : undefined}
          >
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
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Area juridica</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Calor</th>
                    <th className="px-4 py-3">SLA</th>
                    <th className="px-4 py-3 text-right">Acoes Rapidas</th>
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
                          className={cn(
                            'border-t','border-border hover:bg-surface-2/60',
                          )}
                          onClick={() => navigate(`/app/caso/${caso.id}`)}
                        >
                        <td className="px-4 py-3 text-xs text-text-subtle">
                          #{caso.id.replace('caso-', '')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <span className="text-sm font-semibold text-text">
                              {caso.cliente}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                              areaPill(caso.area),
                            )}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold">
                              1
                            </span>
                            {caso.area}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-sm',
                              caso.slaRisk === 'critico' && 'text-danger',
                            )}
                          >
                            {statusLabel(caso.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium',
                              heatPill(caso.heat),
                            )}
                          >
                            {caso.heat}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className={cn('h-full', slaTone(caso.slaRisk))}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-subtle">
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                navigate(`/app/caso/${caso.id}`)
                              }}
                              className={cn(
                                'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-text',
                              )}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            {canManageCasos && (
                              <>
                                <button
                                  type="button"
                                  title="Encaminhar"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setAssigningCasoId((current) => (current === caso.id ? null : caso.id))
                                    setSelectedCasoAdvogadoId('')
                                  }}
                                  className={cn(
                                    'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-brand-secondary',
                                  )}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleEditCaso(caso.id)
                                  }}
                                  className={cn(
                                    'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-brand-secondary',
                                  )}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleDeleteCaso(caso.id, caso.title)
                                  }}
                                  className={cn(
                                    'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-red-600',
                                  )}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {canManageCasos && assigningCasoId === caso.id && (
                        <tr
                          className={cn(
                            'border-t','border-border bg-surface-2/60',
                          )}
                        >
                          <td colSpan={7} className="px-4 py-3">
                            <div
                              className={cn(
                                'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs','border-border bg-white text-text-muted',
                              )}
                            >
                              <span className="text-xs font-semibold">Encaminhar para</span>
                              <select
                                className={cn(
                                  'h-9 rounded-lg border px-3 text-xs','border-border bg-white text-text',
                                )}
                                value={selectedCasoAdvogadoId}
                                onChange={(event) => setSelectedCasoAdvogadoId(event.target.value)}
                              >
                                <option value="">Selecione um advogado</option>
                                {advogados.map((advogado) => (
                                  <option key={advogado.id} value={advogado.id}>
                                    {advogado.nome}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                className="h-9 px-4 text-xs"
                                onClick={() => {
                                  void handleEncaminharCaso(caso.id)
                                }}
                              >
                                Encaminhar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'h-9 px-4 text-xs',
                                  'text-text-muted hover:text-text',
                                )}
                                onClick={() => {
                                  setAssigningCasoId(null)
                                  setSelectedCasoAdvogadoId('')
                                }}
                              >
                                Cancelar
                              </Button>
                              {advogados.length === 0 && (
                                <span className="text-xs">Nenhum advogado cadastrado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
              <div
                className={cn(
                  'flex items-center justify-between border-t px-4 py-3 text-xs','border-border bg-surface-2 text-text-muted',
                )}
              >
                <span>
                  Mostrando {filtered.length} de {casos.length} casos
                </span>
                <div className="flex items-center gap-2">
                  {['1', '2', '4', '5'].map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={cn(
                        'h-7 w-7 rounded-lg border text-xs','border-border bg-white text-text-muted hover:text-text',
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PageState>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
