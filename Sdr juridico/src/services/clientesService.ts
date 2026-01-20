import { supabase } from '@/lib/supabaseClient'
import type { ClienteRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope } from '@/services/orgScope'

type DbClienteRow = {
  id: string
  created_at: string
  org_id?: string | null
  tipo: string
  nome: string
  documento?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: Record<string, any> | null
  tags?: string[] | null
  observacoes?: string | null
  owner_user_id?: string | null
}

const extractTagValue = (tags: string[] | null | undefined, prefix: string) => {
  if (!tags) return null
  const tag = tags.find((value) => value.startsWith(`${prefix}:`))
  return tag ? tag.slice(prefix.length + 1) : null
}

const mapDbClienteToClienteRow = (row: DbClienteRow, ownerNames?: Map<string, string>): ClienteRow => {
  const endereco = row.endereco || {}
  const status = (extractTagValue(row.tags, 'status') || 'ativo') as ClienteRow['status']
  const health = (extractTagValue(row.tags, 'health') || 'ok') as ClienteRow['health']
  const area = extractTagValue(row.tags, 'area')
  const ownerName = row.owner_user_id ? ownerNames?.get(row.owner_user_id) : null
  const enderecoFull =
    endereco.full ||
    [endereco.street, endereco.number, endereco.neighborhood, endereco.city, endereco.state]
      .filter(Boolean)
      .join(', ') ||
    null

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.created_at,
    org_id: row.org_id ?? null,
    nome: row.nome,
    email: row.email || '',
    telefone: row.telefone || null,
    empresa: row.tipo === 'pj' ? row.nome : null,
    cnpj: row.tipo === 'pj' ? row.documento || null : null,
    cpf: row.tipo === 'pf' ? row.documento || null : null,
    endereco: enderecoFull,
    cidade: endereco.city || null,
    estado: endereco.state || null,
    cep: endereco.zip_code || endereco.cep || null,
    area_atuacao: area || null,
    responsavel: ownerName || row.owner_user_id || null,
    status,
    health,
    observacoes: row.observacoes || null,
  }
}

const buildEnderecoPayload = (cliente: Partial<ClienteRow>) => {
  const endereco: Record<string, any> = {}
  if (cliente.endereco) endereco.full = cliente.endereco
  if (cliente.cidade) endereco.city = cliente.cidade
  if (cliente.estado) endereco.state = cliente.estado
  if (cliente.cep) endereco.zip_code = cliente.cep
  return Object.keys(endereco).length > 0 ? endereco : undefined
}

const buildClientePayload = (cliente: Partial<ClienteRow>, applyDefaults: boolean) => {
  const payload: Partial<DbClienteRow> = {}

  if (cliente.nome !== undefined) payload.nome = cliente.nome
  if (cliente.email !== undefined) payload.email = cliente.email
  if (cliente.telefone !== undefined) payload.telefone = cliente.telefone
  if (cliente.observacoes !== undefined) payload.observacoes = cliente.observacoes

  if (cliente.cnpj) {
    payload.tipo = 'pj'
    payload.documento = cliente.cnpj
  } else if (cliente.cpf) {
    payload.tipo = 'pf'
    payload.documento = cliente.cpf
  } else if (applyDefaults && !payload.tipo) {
    payload.tipo = 'pf'
  }

  const endereco = buildEnderecoPayload(cliente)
  if (endereco) payload.endereco = endereco

  const tags: string[] = []
  if (cliente.area_atuacao) tags.push(`area:${cliente.area_atuacao}`)
  if (cliente.status) tags.push(`status:${cliente.status}`)
  if (cliente.health) tags.push(`health:${cliente.health}`)
  if (tags.length) payload.tags = tags

  return payload
}

export const clientesService = {
  /**
   * Busca todos os clientes
   */
  async getClientes(): Promise<ClienteRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbClienteRow) => mapDbClienteToClienteRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },

  /**
   * Busca um cliente especifico
   */
  async getCliente(id: string): Promise<ClienteRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Cliente nao encontrado', 'not_found')

      return mapDbClienteToClienteRow(data as DbClienteRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar cliente', 'database_error')
    }
  },

  /**
   * Busca clientes por nome/empresa
   */
  async getClientesByEmpresa(empresa: string): Promise<ClienteRow[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('clientes')
        .select('*')
        .or(`nome.ilike.%${empresa}%,email.ilike.%${empresa}%`)
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
      return (data || []).map((row: DbClienteRow) => mapDbClienteToClienteRow(row))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },

  /**
   * Busca cliente por documento (cpf/cnpj)
   */
  async getClienteByCnpj(cnpj: string): Promise<ClienteRow | null> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return null

      const query = supabase
        .from('clientes')
        .select('*')
        .eq('documento', cnpj)
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq('org_id', orgId).single()

      if (error && error.code !== 'PGRST116') throw new AppError(error.message, 'database_error')
      return data ? mapDbClienteToClienteRow(data as DbClienteRow) : null
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar cliente', 'database_error')
    }
  },

  /**
   * Cria um novo cliente
   */
  async createCliente(
    cliente: Omit<ClienteRow, 'id' | 'created_at' | 'org_id' | 'updated_at'>
  ): Promise<ClienteRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildClientePayload(cliente, true)
      if (!isFartechAdmin) {
        payload.org_id = orgId
      }
      const { data, error } = await supabase
        .from('clientes')
        .insert([payload])
        .select('*')
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar cliente', 'database_error')

      return mapDbClienteToClienteRow(data as DbClienteRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar cliente', 'database_error')
    }
  },

  /**
   * Atualiza um cliente existente
   */
  async updateCliente(
    id: string,
    updates: Partial<Omit<ClienteRow, 'id' | 'created_at' | 'org_id' | 'updated_at'>>
  ): Promise<ClienteRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const payload = buildClientePayload(updates, false)
      const query = supabase
        .from('clientes')
        .update(payload)
        .eq('id', id)
        .select('*')
      const { data, error } = isFartechAdmin
        ? await query.single()
        : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Cliente nao encontrado', 'not_found')

      return mapDbClienteToClienteRow(data as DbClienteRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar cliente', 'database_error')
    }
  },

  /**
   * Deleta um cliente
   */
  async deleteCliente(id: string): Promise<void> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('clientes')
        .delete()
        .eq('id', id)
      const { error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar cliente', 'database_error')
    }
  },

  /**
   * Busca clientes com contagem de casos
   */
  async getClientesComCasos(): Promise<(ClienteRow & { casos_count: number })[]> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) return []

      const query = supabase
        .from('clientes')
        .select('*, casos(count)')
        .order('created_at', { ascending: false })
      const { data, error } = isFartechAdmin ? await query : await query.eq('org_id', orgId)

      if (error) throw new AppError(error.message, 'database_error')

      const ownerIds = (data || [])
        .map((client: any) => client.owner_user_id)
        .filter(Boolean) as string[]
      const uniqueOwnerIds = Array.from(new Set(ownerIds))

      let ownerNames = new Map<string, string>()
      if (uniqueOwnerIds.length) {
        const { data: owners, error: ownersError } = await supabase
          .from('usuarios')
          .select('id, nome_completo')
          .in('id', uniqueOwnerIds)
        if (ownersError) throw new AppError(ownersError.message, 'database_error')
        ownerNames = new Map((owners || []).map((owner) => [owner.id, owner.nome_completo]))
      }

      return (data || []).map((client: any) => ({
        ...mapDbClienteToClienteRow(client as DbClienteRow, ownerNames),
        casos_count: client.casos?.[0]?.count || 0,
      }))
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar clientes', 'database_error')
    }
  },

  async assignClienteAdvogado(clienteId: string, advogadoId: string): Promise<ClienteRow> {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope()
      if (!isFartechAdmin && !orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error')
      }

      const query = supabase
        .from('clientes')
        .update({ owner_user_id: advogadoId })
        .eq('id', clienteId)
        .select('*')
      const { data, error } = isFartechAdmin
        ? await query.single()
        : await query.eq('org_id', orgId).single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Cliente nao encontrado', 'not_found')

      return mapDbClienteToClienteRow(data as DbClienteRow)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao encaminhar cliente', 'database_error')
    }
  },
}
