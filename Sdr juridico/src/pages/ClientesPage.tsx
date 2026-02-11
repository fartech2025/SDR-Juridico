import * as React from 'react'
import { Search, Plus, Pencil, Trash2, UserPlus, Users, AlertTriangle, CheckCircle, CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

import { PageState } from '@/components/PageState'
import { ClienteDrawer } from '@/components/ClienteDrawer'
import type { Cliente } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'
import { useClientes } from '@/hooks/useClientes'
import { useAdvogados } from '@/hooks/useAdvogados'
import { useOrganization } from '@/hooks/useOrganization'
import type { ClienteRow } from '@/lib/supabaseClient'
import { clientesService } from '@/services/clientesService'
import { buscarEmpresaPorCnpj, formatarCnpj } from '@/services/queridoDiarioService'

// ========== UTILITÁRIOS DE CPF/CNPJ ==========

// Valida CPF usando algoritmo oficial
function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numeros)) return false // Todos dígitos iguais
  
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numeros[9])) return false
  
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(numeros[10])
}

// Valida CNPJ usando algoritmo oficial
function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return false
  if (/^(\d)\1{13}$/.test(numeros)) return false // Todos dígitos iguais
  
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let soma = 0
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros[i]) * pesos1[i]
  }
  let resto = soma % 11
  const digito1 = resto < 2 ? 0 : 11 - resto
  if (digito1 !== parseInt(numeros[12])) return false
  
  soma = 0
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros[i]) * pesos2[i]
  }
  resto = soma % 11
  const digito2 = resto < 2 ? 0 : 11 - resto
  return digito2 === parseInt(numeros[13])
}

// Formata CPF: 000.000.000-00
function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length <= 3) return numeros
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`
}

// Formata CNPJ: 00.000.000/0000-00
function formatarCNPJInput(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`
  if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`
  if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`
}

// ========== FIM UTILITÁRIOS ==========

const resolveStatus = (
  value: string | null,
): 'loading' | 'empty' | 'error' | 'ready' => {
  if (value === 'loading' || value === 'empty' || value === 'error') {
    return value
  }
  return 'ready'
}

const statusBadge = (status: Cliente['status']) => {
  if (status === 'inativo') {
    return 'bg-surface-alt text-text-muted'
  }
  if (status === 'em_risco') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-green-100 text-green-700'
}

const healthBadge = (health: Cliente['health']) => {
  if (health === 'critico') {
    return 'bg-red-100 text-red-700'
  }
  if (health === 'atencao') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-green-100 text-green-700'
}

export const ClientesPage = () => {
  const { clientes, loading, error, fetchClientes, createCliente, updateCliente, deleteCliente, assignClienteAdvogado } = useClientes()
  const { currentRole, isFartechAdmin, currentOrg } = useOrganization()
  const canManageClientes = isFartechAdmin || ['org_admin', 'gestor', 'admin'].includes(currentRole || '')
  const { advogados } = useAdvogados(currentOrg?.id || null, canManageClientes)
  const [params] = useSearchParams()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('todos')
  const [healthFilter, setHealthFilter] = React.useState('todos')
  const [areaFilter, setAreaFilter] = React.useState('todos')
  const [ownerFilter, setOwnerFilter] = React.useState('todos')
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
    bairro: '',
    numero: '',
    cidade: '',
    estado: '',
    cep: '',
  }), [])

  const [formData, setFormData] = React.useState(initialFormData)
  const isEditing = Boolean(editingClienteId)
  
  // Estado para busca de CEP
  const [buscandoCep, setBuscandoCep] = React.useState(false)

  // Formatar CEP: 00000-000
  const formatCep = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 8)
    if (nums.length <= 5) return nums
    return `${nums.slice(0, 5)}-${nums.slice(5)}`
  }

  // Buscar endereço pelo CEP via ViaCEP
  const buscarCep = React.useCallback(async (cep: string) => {
    const nums = cep.replace(/\D/g, '')
    if (nums.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }
      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }))
      toast.success('Endereço preenchido automaticamente')
    } catch {
      toast.error('Erro ao consultar CEP')
    } finally {
      setBuscandoCep(false)
    }
  }, [])

  // Estado para enriquecimento de dados
  const [buscandoDados, setBuscandoDados] = React.useState(false)
  const [documentoValido, setDocumentoValido] = React.useState<boolean | null>(null)
  const [dadosEnriquecidos, setDadosEnriquecidos] = React.useState(false)

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

  const stats = React.useMemo(() => ({
    total: clientes.length,
    ativos: clientes.filter(c => c.status === 'ativo').length,
    emRisco: clientes.filter(c => c.status === 'em_risco').length,
  }), [clientes])

  const forcedState = resolveStatus(params.get('state'))
  const baseState = loading
    ? 'loading'
    : error
      ? 'error'
      : filteredClientes.length === 0
        ? 'empty'
        : 'ready'
  const pageState = forcedState !== 'ready' ? forcedState : baseState
  const emptyAction = canManageClientes ? (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--brand-primary)' }}
      onClick={() => {
        resetClienteForm()
        setShowForm(true)
      }}
    >
      <Plus className="h-4 w-4" />
      Novo cliente
    </button>
  ) : null

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
    setDocumentoValido(null)
    setDadosEnriquecidos(false)
  }

  // Função para tratar mudança de documento (CPF/CNPJ)
  const handleDocumentoChange = async (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    
    // Detectar automaticamente o tipo e formatar
    if (numeros.length <= 11) {
      // CPF
      const formatado = formatarCPF(numeros)
      setFormData(prev => ({ ...prev, documento: formatado, tipo: 'pf' }))
      
      // Validar quando completo
      if (numeros.length === 11) {
        const valido = validarCPF(numeros)
        setDocumentoValido(valido)
        if (!valido) {
          toast.error('CPF inválido. Verifique os dígitos.')
        } else {
          toast.success('CPF válido!')
        }
      } else {
        setDocumentoValido(null)
      }
    } else {
      // CNPJ
      const formatado = formatarCNPJInput(numeros)
      setFormData(prev => ({ ...prev, documento: formatado, tipo: 'pj' }))
      
      // Validar quando completo
      if (numeros.length === 14) {
        const valido = validarCNPJ(numeros)
        setDocumentoValido(valido)
        
        if (!valido) {
          toast.error('CNPJ inválido. Verifique os dígitos.')
        } else {
          // CNPJ válido - buscar dados automaticamente
          toast.success('CNPJ válido! Buscando dados...')
          await enriquecerDadosCNPJ(numeros)
        }
      } else {
        setDocumentoValido(null)
      }
    }
  }

  // Função para enriquecer dados via CNPJ
  const enriquecerDadosCNPJ = async (cnpj: string) => {
    setBuscandoDados(true)
    try {
      const empresa = await buscarEmpresaPorCnpj(cnpj)
      
      if (empresa) {
        // Montar endereço completo
        const enderecoCompleto = [
          empresa.logradouro,
          empresa.numero,
          empresa.complemento,
          empresa.bairro
        ].filter(Boolean).join(', ')
        
        // Atualizar formulário com dados da empresa
        setFormData(prev => ({
          ...prev,
          nome: prev.nome || empresa.razao_social || empresa.nome_fantasia || '',
          email: prev.email || empresa.correio_eletronico?.toLowerCase() || '',
          telefone: prev.telefone || empresa.ddd_telefone_1 || '',
          endereco: prev.endereco || enderecoCompleto || '',
          cidade: prev.cidade || empresa.municipio || '',
          estado: prev.estado || empresa.uf || '',
          cep: prev.cep || empresa.cep || '',
          area_atuacao: prev.area_atuacao || empresa.cnae?.split(' - ')[1] || '',
        }))
        
        setDadosEnriquecidos(true)
        toast.success(`✨ Dados carregados: ${empresa.razao_social || empresa.nome_fantasia}`)
      } else {
        toast.warning('CNPJ não encontrado na base de dados pública.')
      }
    } catch (error) {
      console.error('Erro ao buscar dados do CNPJ:', error)
      toast.error('Não foi possível buscar dados do CNPJ.')
    } finally {
      setBuscandoDados(false)
    }
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
        bairro: '',
        numero: '',
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
      // Combinar endereço: logradouro + número + bairro
      const partes = [formData.endereco, formData.numero, formData.bairro].filter(Boolean)
      const enderecoCompleto = partes.join(', ') || null

      const payload: Omit<ClienteRow, 'id' | 'created_at' | 'updated_at' | 'org_id'> = {
        nome: formData.nome,
        email: formData.email || '',
        telefone: formData.telefone || null,
        empresa: null,
        cnpj: formData.tipo === 'pj' ? (formData.documento || null) : null,
        cpf: formData.tipo === 'pf' ? (formData.documento || null) : null,
        endereco: enderecoCompleto,
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

  // Form view
  if (showForm) {
    return (
      <div className="bg-surface-alt" style={{ fontFamily: "'DM Sans', sans-serif", padding: '20px' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {isEditing ? 'Editar cliente' : 'Novo cliente'}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-text">
                {isEditing ? 'Atualizar cadastro' : 'Cadastrar cliente'}
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                {isEditing ? 'Atualize os dados e salve as alterações.' : 'Preencha os dados para criar um novo cliente.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetClienteForm()
                setShowForm(false)
              }}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt"
            >
              Voltar
            </button>
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Nome *</label>
                <input
                  value={formData.nome}
                  onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Telefone</label>
                <input
                  value={formData.telefone}
                  onChange={(event) => setFormData({ ...formData, telefone: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(event) => setFormData({ ...formData, tipo: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="pf">Pessoa física</option>
                  <option value="pj">Pessoa jurídica</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text flex items-center gap-2">
                  {formData.tipo === 'pj' ? 'CNPJ' : 'CPF'}
                  {buscandoDados && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Buscando dados...
                    </span>
                  )}
                  {dadosEnriquecidos && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Building2 className="h-3 w-3" />
                      Dados carregados
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    value={formData.documento}
                    onChange={(event) => handleDocumentoChange(event.target.value)}
                    disabled={buscandoDados}
                    className={`h-11 w-full rounded-lg border bg-white px-4 pr-10 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 ${
                      documentoValido === true
                        ? 'border-green-400 focus:border-green-500 focus:ring-green-200'
                        : documentoValido === false
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                        : 'border-border focus:border-brand-primary focus:ring-brand-primary/20'
                    } ${buscandoDados ? 'bg-surface-alt' : ''}`}
                    placeholder={formData.tipo === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
                    maxLength={18}
                  />
                  {/* Indicador de validação */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {buscandoDados ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : documentoValido === true ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : documentoValido === false ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  {formData.tipo === 'pj' 
                    ? 'Digite o CNPJ para buscar dados automaticamente da Receita Federal'
                    : 'Digite o CPF para validação automática'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Área de atuação</label>
                <input
                  value={formData.area_atuacao}
                  onChange={(event) => setFormData({ ...formData, area_atuacao: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Ex: Empresarial, Trabalhista"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value as ClienteRow['status'] })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="ativo">Ativo</option>
                  <option value="em_risco">Em risco</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Saúde</label>
                <select
                  value={formData.health || 'ok'}
                  onChange={(event) => setFormData({ ...formData, health: event.target.value as ClienteRow['health'] })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="ok">Ok</option>
                  <option value="atencao">Atenção</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>
              {/* CEP — primeiro campo de endereço */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">CEP</label>
                <div className="flex gap-2">
                  <input
                    value={formData.cep}
                    onChange={(event) => {
                      const formatted = formatCep(event.target.value)
                      setFormData({ ...formData, cep: formatted })
                      // Auto-busca ao completar 9 chars (00000-000)
                      if (formatted.replace(/\D/g, '').length === 8) {
                        buscarCep(formatted)
                      }
                    }}
                    className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <button
                    type="button"
                    onClick={() => buscarCep(formData.cep)}
                    disabled={buscandoCep || formData.cep.replace(/\D/g, '').length !== 8}
                    className="h-11 px-4 rounded-lg border border-border bg-white text-sm font-medium text-text hover:bg-surface-alt disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                  >
                    {buscandoCep ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-primary border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </button>
                </div>
              </div>
              {/* Logradouro */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Logradouro</label>
                <input
                  value={formData.endereco}
                  onChange={(event) => setFormData({ ...formData, endereco: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Rua, Avenida..."
                />
              </div>
              {/* Número */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Número</label>
                <input
                  value={formData.numero}
                  onChange={(event) => setFormData({ ...formData, numero: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Nº"
                />
              </div>
              {/* Bairro */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Bairro</label>
                <input
                  value={formData.bairro}
                  onChange={(event) => setFormData({ ...formData, bairro: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Bairro"
                />
              </div>
              {/* Cidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Cidade</label>
                <input
                  value={formData.cidade}
                  onChange={(event) => setFormData({ ...formData, cidade: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Cidade"
                />
              </div>
              {/* Estado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Estado</label>
                <input
                  value={formData.estado}
                  onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-white px-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-text">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(event) => setFormData({ ...formData, observacoes: event.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetClienteForm()
                  setShowForm(false)
                }}
                className="rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-medium text-text hover:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCliente}
                disabled={saving}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar cliente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="bg-surface-alt" style={{ fontFamily: "'DM Sans', sans-serif", padding: '20px' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)', color: 'var(--brand-primary)' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                  Gestao de Clientes
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text">Clientes</h1>
              <p className="mt-1 text-sm text-text-muted">
                Gerencie sua carteira de clientes com indicadores de risco e status.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void fetchClientes()}
                disabled={loading}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:bg-surface-alt disabled:opacity-50"
              >
                Atualizar
              </button>
              {canManageClientes && (
                <button
                  type="button"
                  onClick={() => {
                    resetClienteForm()
                    setShowForm(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Plus className="h-4 w-4" />
                  Novo cliente
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(114, 16, 17, 0.1)' }}>
                <Users className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.total}</p>
                <p className="text-sm text-text-muted">Total de Clientes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.ativos}</p>
                <p className="text-sm text-text-muted">Ativos</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stats.emRisco}</p>
                <p className="text-sm text-text-muted">Em Risco</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              <input
                className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="Buscar cliente..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
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
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value)}
            >
              <option value="todos">Saúde</option>
              {filters.health.map((health) => (
                <option key={health} value={health}>
                  {health}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
            >
              <option value="todos">Área</option>
              {filters.area.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
            >
              <option value="todos">Responsável</option>
              {filters.owner.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
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
          <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
            <span>Total: {clientes.length}</span>
            <span>·</span>
            <span>Exibindo: {filteredClientes.length}</span>
          </div>
        </div>

        {/* Table */}
        <PageState
          status={pageState}
          emptyTitle="Nenhum cliente encontrado"
          emptyDescription="Ajuste os filtros para localizar a carteira."
          emptyAction={emptyAction}
          onRetry={error ? fetchClientes : undefined}
        >
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs font-medium uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Saúde</th>
                  <th className="px-4 py-3">Casos</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3 text-right">Atualização</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClientes.map((cliente) => {
                  const initials = cliente.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                  return (
                    <React.Fragment key={cliente.id}>
                      <tr
                        className="cursor-pointer hover:bg-surface-alt"
                        onClick={() => setSelectedCliente(cliente)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border-strong"
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: 'var(--brand-primary)' }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-text">
                                {cliente.name}
                              </div>
                              <div className="text-xs text-text-muted">
                                {cliente.area}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                              statusBadge(cliente.status),
                            )}
                          >
                            {cliente.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                              healthBadge(cliente.health),
                            )}
                          >
                            {cliente.health}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text">
                          {cliente.caseCount}
                        </td>
                        <td className="px-4 py-3 text-text">
                          {cliente.owner}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-text-muted">
                          {formatDateTime(cliente.lastUpdate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManageClientes ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Encaminhar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-surface-alt hover:text-text-muted"
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
                                title="Editar"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-surface-alt hover:text-text-muted"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleEditCliente(cliente.id)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Excluir"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle hover:bg-surface-alt hover:text-red-600"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteCliente(cliente.id, cliente.name)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-subtle">Sem permissão</span>
                          )}
                        </td>
                      </tr>
                      {canManageClientes && assigningClienteId === cliente.id && (
                        <tr className="bg-surface-alt">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                              <span className="text-sm font-medium text-text">Encaminhar para:</span>
                              <select
                                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
                              <button
                                type="button"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                                style={{ backgroundColor: 'var(--brand-primary)' }}
                                onClick={() => {
                                  void handleEncaminharCliente(cliente.id)
                                }}
                              >
                                Encaminhar
                              </button>
                              <button
                                type="button"
                                className="text-sm text-text-muted hover:text-text"
                                onClick={() => {
                                  setAssigningClienteId(null)
                                  setSelectedClienteAdvogadoId('')
                                }}
                              >
                                Cancelar
                              </button>
                              {advogados.length === 0 && (
                                <span className="text-xs text-text-muted">Nenhum advogado cadastrado</span>
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
      </div>
      <ClienteDrawer
        open={Boolean(selectedCliente)}
        cliente={selectedCliente}
        onClose={() => setSelectedCliente(null)}
      />
    </div>
  )
}
