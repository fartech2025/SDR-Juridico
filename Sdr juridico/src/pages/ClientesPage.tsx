import * as React from 'react'
import { Search, Plus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClienteDrawer } from '@/components/ClienteDrawer'
import heroLight from '@/assets/hero-light.svg'
import type { Cliente } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'
import { useClientes } from '@/hooks/useClientes'
import { useAdvogados } from '@/hooks/useAdvogados'
import { useOrganization } from '@/hooks/useOrganization'
import type { ClienteRow } from '@/lib/supabaseClient'
import { clientesService } from '@/services/clientesService'

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusPill = (status: Cliente['status']) => {
  if (status === 'inativo') {
    return 'border-border bg-surface-2 text-text-muted'
  }
  if (status === 'em_risco') {
    return 'border-danger-border bg-danger-bg text-danger'
  }
  return 'border-success-border bg-success-bg text-success'
}

const healthPill = (health: Cliente['health']) => {
  if (health === 'critico') {
    return 'border-danger-border bg-danger-bg text-danger'
  }
  if (health === 'atencao') {
    return 'border-warning-border bg-warning-bg text-warning'
  }
  return 'border-success-border bg-success-bg text-success'
}

const appShellClass = 'min-h-screen bg-base text-text pb-12'
const heroCardClass =
  'relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt p-8 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]'
const formControlClass =
  'h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text shadow-sm placeholder:text-text-subtle transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const textareaControlClass =
  'rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text shadow-sm placeholder:text-text-subtle transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'
const labelClass = 'text-sm font-semibold text-text'
const filterControlClass =
  'h-11 rounded-full border border-border bg-white px-3 text-sm text-text shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15'

export const ClientesPage = () => {
  const { clientes, loading, error, createCliente, updateCliente, deleteCliente, assignClienteAdvogado } = useClientes()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageClientes = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const { advogados } = useAdvogados(currentOrg?.id || null, canManageClientes)
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [healthFilter, setHealthFilter] = React.useState('todos')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [ownerFilter, setOwnerFilter] = React.useState('todos')
  const [activeTab, setActiveTab] = React.useState('Todos')
  const [showForm, setShowForm] = React.useState(false)
  const [editingClienteId, setEditingClienteId] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [assigningClienteId, setAssigningClienteId] = React.useState<string | null>(null)
  const [selectedClienteAdvogadoId, setSelectedClienteAdvogadoId] = React.useState('')
  const [selectedCliente, setSelectedCliente] = React.useState<Cliente | null>(null)

  const initialFormData = React.useMemo(() => ({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'pf',
    documento: '',
    area_atuacao: '',
    status: 'ativo' as ClienteRow['status'],
    health: 'ok' as ClienteRow['health'],
    observacoes: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  }), [])

  const [formData, setFormData] = React.useState(initialFormData)
  const isEditing = Boolean(editingClienteId)

  const tabs = [
    'Todos',
    'Docs',
    'Agenda',
    'Comercial',
    'Juridico',
    'Automacao',
  ]

  const filters = React.useMemo(
    () => ({
      status: Array.from(new Set(clientes.map((cliente) => cliente.status))),
      health: Array.from(new Set(clientes.map((cliente) => cliente.health))),
      area: Array.from(new Set(clientes.map((cliente) => cliente.area))),
      owner: Array.from(new Set(clientes.map((cliente) => cliente.owner))),
    }),
    [clientes],
  )

  const filteredClientes = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return clientes.filter((cliente) => {
      const matchesQuery = !term || cliente.name.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'todos' || cliente.status === statusFilter
      const matchesHealth =
        healthFilter === 'todos' || cliente.health === healthFilter
      const matchesArea = areaFilter === 'todos' || cliente.area === areaFilter
      const matchesOwner =
        ownerFilter === 'todos' || cliente.owner === ownerFilter
      return (
        matchesQuery && matchesStatus && matchesHealth && matchesArea && matchesOwner
      )
    })
  }, [query, statusFilter, healthFilter, areaFilter, ownerFilter, clientes])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredClientes.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('todos')
    setHealthFilter('todos')
    setAreaFilter('todos')
    setOwnerFilter('todos')
  }

  const resetClienteForm = () => {
    setFormData(initialFormData)
    setEditingClienteId(null)
  }

  const handleEditCliente = async (clienteId: string) => {
    if (!canManageClientes) {
      toast.error('Apenas gestores podem editar clientes.')
      return
    }
    setSaving(true)
    try {
      const cliente = await clientesService.getCliente(clienteId)
      const tipo = cliente.cnpj ? 'pj' : 'pf'
      const documento = cliente.cnpj || cliente.cpf || ''
      setFormData({
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        tipo,
        documento,
        area_atuacao: cliente.area_atuacao || '',
        status: cliente.status,
        health: cliente.health || 'ok',
        observacoes: cliente.observacoes || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
      })
      setEditingClienteId(clienteId)
      setShowForm(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar cliente'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCliente = async (clienteId: string, nome: string) => {
    if (!canManageClientes) {
      toast.error('Apenas gestores podem excluir clientes.')
      return
    }
    const confirmed = window.confirm(`Excluir o cliente "${nome}"? Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    try {
      await deleteCliente(clienteId)
      toast.success(`Cliente excluído: ${nome}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir cliente'
      toast.error(message)
    }
  }

  const handleEncaminharCliente = async (clienteId: string) => {
    if (!selectedClienteAdvogadoId) {
      toast.error('Selecione um advogado para encaminhar.')
      return
    }
    const advogado = advogados.find((item) => item.id === selectedClienteAdvogadoId)
    if (!advogado) {
      toast.error('Advogado nao encontrado.')
      return
    }
    try {
      await assignClienteAdvogado(clienteId, advogado.id)
      toast.success(`Cliente encaminhado para ${advogado.nome}`)
      setAssigningClienteId(null)
      setSelectedClienteAdvogadoId('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encaminhar cliente'
      toast.error(message)
    }
  }

  const handleSaveCliente = async () => {
    if (!canManageClientes) {
      toast.error('Apenas gestores podem adicionar clientes.')
      return
    }
    if (!formData.nome) {
      toast.error('Informe o nome do cliente.')
      return
    }

    setSaving(true)
    try {
      const payload: Omit<ClienteRow, 'id' | 'created_at' | 'updated_at' | 'org_id'> = {
        nome: formData.nome,
        email: formData.email || '',
        telefone: formData.telefone || null,
        empresa: null,
        cnpj: formData.tipo === 'pj' ? (formData.documento || null) : null,
        cpf: formData.tipo === 'pf' ? (formData.documento || null) : null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        area_atuacao: formData.area_atuacao || null,
        responsavel: null,
        status: formData.status,
        health: formData.health || 'ok',
        observacoes: formData.observacoes || null,
      }

      if (editingClienteId) {
        await updateCliente(editingClienteId, payload)
        toast.success('Cliente atualizado com sucesso.')
      } else {
        await createCliente(payload)
        toast.success('Cliente criado com sucesso.')
      }
      resetClienteForm()
      setShowForm(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar cliente'
      toast.error(message)
  } finally {
      setSaving(false)
    }
  }

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
                    <div
                      className={cn(
                        'rounded-full p-2',
                        'bg-brand-secondary/20',
                      )}
                    >
                      <Plus className={cn('h-5 w-5', 'text-brand-secondary')} />
                    </div>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-[0.3em]',
                        'text-brand-secondary',
                      )}
                    >
                      {isEditing ? 'Editar cliente' : 'Novo cliente'}
                    </p>
                  </div>
                  <h2 className={cn('font-display text-4xl font-bold', 'text-text')}>
                    {isEditing ? 'Atualizar cadastro' : 'Cadastrar cliente'}
                  </h2>
                  <p className={cn('text-base', 'text-text-muted')}>
                    {isEditing ? 'Atualize os dados e salve as alteracoes.' : 'Preencha os dados para criar um novo cliente.'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    resetClienteForm()
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
                <div className="space-y-2">
                  <label className={labelClass}>
                    Nome *
                  </label>
                  <input
                    value={formData.nome}
                    onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                    className={formControlClass}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className={formControlClass}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Telefone
                  </label>
                  <input
                    value={formData.telefone}
                    onChange={(event) => setFormData({ ...formData, telefone: event.target.value })}
                    className={formControlClass}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(event) => setFormData({ ...formData, tipo: event.target.value })}
                    className={formControlClass}
                  >
                    <option value="pf">Pessoa fisica</option>
                    <option value="pj">Pessoa juridica</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    {formData.tipo === 'pj' ? 'CNPJ' : 'CPF'}
                  </label>
                  <input
                    value={formData.documento}
                    onChange={(event) => setFormData({ ...formData, documento: event.target.value })}
                    className={formControlClass}
                    placeholder={formData.tipo === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Area de atuacao
                  </label>
                  <input
                    value={formData.area_atuacao}
                    onChange={(event) => setFormData({ ...formData, area_atuacao: event.target.value })}
                    className={formControlClass}
                    placeholder="Ex: Empresarial, Trabalhista"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(event) => setFormData({ ...formData, status: event.target.value as ClienteRow['status'] })}
                    className={formControlClass}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="em_risco">Em risco</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Saude
                  </label>
                  <select
                    value={formData.health || 'ok'}
                    onChange={(event) => setFormData({ ...formData, health: event.target.value as ClienteRow['health'] })}
                    className={formControlClass}
                  >
                    <option value="ok">Ok</option>
                    <option value="atencao">Atencao</option>
                    <option value="critico">Critico</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>
                    Endereco
                  </label>
                  <input
                    value={formData.endereco}
                    onChange={(event) => setFormData({ ...formData, endereco: event.target.value })}
                    className={formControlClass}
                    placeholder="Rua, numero, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Cidade
                  </label>
                  <input
                    value={formData.cidade}
                    onChange={(event) => setFormData({ ...formData, cidade: event.target.value })}
                    className={formControlClass}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Estado
                  </label>
                  <input
                    value={formData.estado}
                    onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
                    className={formControlClass}
                    placeholder="UF"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    CEP
                  </label>
                  <input
                    value={formData.cep}
                    onChange={(event) => setFormData({ ...formData, cep: event.target.value })}
                    className={formControlClass}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClass}>
                    Observacoes
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(event) => setFormData({ ...formData, observacoes: event.target.value })}
                    className={textareaControlClass}
                    placeholder="Observacoes adicionais"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetClienteForm()
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
                  onClick={handleSaveCliente}
                  className={cn(
                    'h-12 rounded-xl px-8 text-sm font-semibold shadow-lg',
                    'bg-gradient-to-r from-brand-secondary to-brand-accent hover:from-brand-secondary-dark hover:to-brand-accent-dark',
                  )}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar cliente'}
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
      <div className="space-y-5">
        <header className={cn(heroCardClass, 'p-6')}>
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
              Clientes
            </p>
            <h2 className={cn('font-display text-2xl', 'text-text')}>
              Carteira ativa
            </h2>
            <p className={cn('text-sm', 'text-text-muted')}>
              Carteira ativa com indicadores de risco e status.
            </p>
          </div>
        </header>

        <Card
          className={cn(
            'border',
            'border-border bg-surface/90',
          )}
        >
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Registros ativos</CardTitle>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-subtle">
                <span>Total: {clientes.length}</span>
                <span>Exibindo: {filteredClientes.length}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-full px-4"
              onClick={() => {
                if (!canManageClientes) {
                  toast.error('Apenas gestores podem adicionar clientes.')
                  return
                }
                resetClienteForm()
                setShowForm(true)
              }}
              disabled={!canManageClientes}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-medium transition',
                  activeTab === tab
                    ?'border-brand-secondary/60 bg-brand-secondary/10 text-brand-secondary'
                    :'border-border bg-white text-text-muted hover:bg-surface-2 hover:text-text',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-text placeholder:text-text-subtle shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                placeholder="Buscar cliente"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
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
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value)}
            >
              <option value="todos">Saude</option>
              {filters.health.map((health) => (
                <option key={health} value={health}>
                  {health}
                </option>
              ))}
            </select>
            <select
              className={filterControlClass}
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
            >
              <option value="todos">Area</option>
              {filters.area.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              className={filterControlClass}
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
            >
              <option value="todos">Responsavel</option>
              {filters.owner.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={cn(
                'h-11 text-xs',
                'text-text-muted hover:text-text',
              )}
              onClick={resetFilters}
            >
              Limpar filtros
            </button>
          </div>

          <PageState
            status={pageState}
            emptyTitle="Nenhum cliente encontrado"
            emptyDescription="Ajuste os filtros para localizar a carteira."
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
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Saude</th>
                    <th className="px-4 py-3">Casos</th>
                    <th className="px-4 py-3">Responsavel</th>
                    <th className="px-4 py-3 text-right">Atualizacao</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => {
                    const initials = cliente.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                    return (
                      <React.Fragment key={cliente.id}>
                        <tr
                          className={cn(
                            'cursor-pointer border-t','border-border hover:bg-surface-2/60',
                          )}
                          onClick={() => setSelectedCliente(cliente)}
                        >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border border-border bg-white text-primary"
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-text">
                                {cliente.name}
                              </div>
                              <div className="text-xs text-text-subtle">
                                {cliente.area}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize',
                              statusPill(cliente.status),
                            )}
                          >
                            {cliente.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize',
                              healthPill(cliente.health),
                            )}
                          >
                            {cliente.health}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {cliente.caseCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {cliente.owner}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-text-subtle">
                          {formatDateTime(cliente.lastUpdate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManageClientes ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                title="Encaminhar"
                                className={cn(
                                  'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-brand-secondary',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setAssigningClienteId((current) => (current === cliente.id ? null : cliente.id))
                                  setSelectedClienteAdvogadoId('')
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-brand-secondary',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleEditCliente(cliente.id)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'inline-flex h-8 w-8 items-center justify-center rounded-full border','border-border bg-white text-text-muted hover:text-red-600',
                                )}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteCliente(cliente.id, cliente.name)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-subtle">Sem permissao</span>
                          )}
                        </td>
                      </tr>
                      {canManageClientes && assigningClienteId === cliente.id && (
                        <tr
                          className={cn(
                            'border-t','border-border bg-surface-2/60',
                          )}
                        >
                          <td colSpan={8} className="px-4 py-3">
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
                                value={selectedClienteAdvogadoId}
                                onChange={(event) => setSelectedClienteAdvogadoId(event.target.value)}
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
                                  void handleEncaminharCliente(cliente.id)
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
                                  setAssigningClienteId(null)
                                  setSelectedClienteAdvogadoId('')
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
            </div>
          </PageState>
        </CardContent>
      </Card>
    </div>
    <ClienteDrawer
      open={Boolean(selectedCliente)}
      cliente={selectedCliente}
      onClose={() => setSelectedCliente(null)}
    />
    </div>
  )
}
