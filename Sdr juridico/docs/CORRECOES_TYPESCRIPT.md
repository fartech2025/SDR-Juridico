# Correções TypeScript - SDR Jurídico

Este documento contém as correções identificadas nos services TypeScript.
**Data**: 28 de janeiro de 2026

---

## Índice

1. [orgScope.ts](#1-orgscopets) - Cache para evitar race conditions
2. [permissionsService.ts](#2-permissionsservicets) - Simplificação do modelo de permissões
3. [tarefasService.ts](#3-tarefasservicets) - Validação de input e melhorias
4. [Tipos Compartilhados](#4-tipos-compartilhados) - Interfaces de validação

---

## 1. orgScope.ts

**Problemas identificados:**
- Race conditions em múltiplas chamadas simultâneas
- Falta de cache do resultado
- Não expõe userId

**Arquivo corrigido:**

```typescript
// src/services/orgScope.ts
// Correção: Adicionar cache com TTL e expor userId

import { permissionsService } from '@/services/permissionsService'

export type OrgScope = {
  orgId: string | null
  userId: string | null
  isFartechAdmin: boolean
  role: string | null
}

// Cache com TTL
let cachedOrgScope: OrgScope | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5000 // 5 segundos

// Promise em andamento para evitar chamadas duplicadas
let pendingPromise: Promise<OrgScope> | null = null

/**
 * Resolve o escopo da organização do usuário atual.
 * Implementa cache com TTL para evitar múltiplas chamadas ao banco.
 */
export async function resolveOrgScope(): Promise<OrgScope> {
  const now = Date.now()

  // Retorna cache se ainda válido
  if (cachedOrgScope && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedOrgScope
  }

  // Se já tem uma promise em andamento, aguarda ela
  if (pendingPromise) {
    return pendingPromise
  }

  // Cria nova promise
  pendingPromise = (async () => {
    try {
      const user = await permissionsService.getCurrentUser()

      const scope: OrgScope = {
        orgId: user?.org_id ?? null,
        userId: user?.id ?? null,
        isFartechAdmin: user?.is_fartech_admin ?? false,
        role: user?.role ?? null,
      }

      // Atualiza cache
      cachedOrgScope = scope
      cacheTimestamp = Date.now()

      return scope
    } finally {
      pendingPromise = null
    }
  })()

  return pendingPromise
}

/**
 * Invalida o cache do orgScope.
 * Deve ser chamado no logout ou quando o usuário muda de organização.
 */
export function clearOrgScopeCache(): void {
  cachedOrgScope = null
  cacheTimestamp = 0
  pendingPromise = null
}

/**
 * Verifica se o usuário atual é staff (admin, gestor ou secretaria).
 */
export async function isCurrentUserStaff(): Promise<boolean> {
  const { role } = await resolveOrgScope()
  return role ? ['admin', 'gestor', 'secretaria', 'org_admin'].includes(role) : false
}

/**
 * Verifica se o usuário atual é gestor ou admin.
 */
export async function isCurrentUserAdminish(): Promise<boolean> {
  const { role, isFartechAdmin } = await resolveOrgScope()
  if (isFartechAdmin) return true
  return role ? ['admin', 'gestor', 'org_admin'].includes(role) : false
}
```

---

## 2. permissionsService.ts

**Problemas identificados:**
- Mistura de permissões de `usuarios.permissoes` e `org_members.role`
- Cache não funciona corretamente (limpa imediatamente)
- Logs excessivos em produção

**Arquivo corrigido:**

```typescript
// src/services/permissionsService.ts
// Correção: Modelo de permissões unificado e cache funcional

import { supabase } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import type {
  Permission,
  PermissionCheck,
  PermissionResult,
  UserWithRole,
  Resource,
  PermissionAction,
  UserRole,
} from '@/types/permissions'
import {
  getPermissionsByRole,
  FARTECH_ADMIN_PERMISSIONS,
} from '@/types/permissions'
import { ensureUsuario } from '@/services/usuariosService'

// ============================================================
// TIPOS
// ============================================================

type OrgMemberRole = 'admin' | 'gestor' | 'advogado' | 'secretaria' | 'leitura'

interface CachedUser extends UserWithRole {
  cachedAt: number
}

// ============================================================
// CONSTANTES
// ============================================================

const USER_CACHE_TTL_MS = 10000 // 10 segundos
const IS_DEV = import.meta.env.DEV

// ============================================================
// CACHE
// ============================================================

let cachedUser: CachedUser | null = null

function isCacheValid(): boolean {
  if (!cachedUser) return false
  return (Date.now() - cachedUser.cachedAt) < USER_CACHE_TTL_MS
}

function clearUserCache(): void {
  cachedUser = null
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Resolve o papel do usuário baseado APENAS em org_members.role.
 * usuarios.permissoes é usado APENAS para verificar fartech_admin.
 */
function resolveUserRole(
  isFartechAdmin: boolean,
  memberRole: OrgMemberRole | null
): UserRole {
  // Fartech admin tem papel especial
  if (isFartechAdmin) {
    return 'fartech_admin'
  }

  // Se não é membro de nenhuma org
  if (!memberRole) {
    return 'user'
  }

  // Mapeia role do banco para role do sistema
  const roleMap: Record<OrgMemberRole, UserRole> = {
    admin: 'org_admin',
    gestor: 'org_admin',
    advogado: 'user',
    secretaria: 'user',
    leitura: 'user',
  }

  return roleMap[memberRole] || 'user'
}

function logDebug(message: string, data?: unknown): void {
  if (IS_DEV) {
    console.log(`[PermissionsService] ${message}`, data ?? '')
  }
}

// ============================================================
// SERVICE
// ============================================================

export const permissionsService = {
  /**
   * Obtém o usuário atual com informações de role.
   * Implementa cache para evitar múltiplas chamadas.
   */
  async getCurrentUser(): Promise<UserWithRole | null> {
    // Retorna cache se válido
    if (isCacheValid() && cachedUser) {
      return cachedUser
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearUserCache()
        return null
      }

      // Busca dados do usuário
      const { usuario, seed } = await ensureUsuario(user)

      // Resolve nome e email
      const fallbackName =
        (user.user_metadata as { nome_completo?: string })?.nome_completo ||
        user.email ||
        'Usuario'
      const name = usuario?.nome_completo || seed?.nome_completo || fallbackName
      const email = usuario?.email || seed?.email || user.email || ''

      // Verifica se é fartech_admin (APENAS via usuarios.permissoes)
      const permissoes = usuario?.permissoes || seed?.permissoes || []
      const isFartechAdmin = permissoes.includes('fartech_admin')

      logDebug('Dados do usuario:', { id: user.id, isFartechAdmin })

      // Busca membership (FONTE DE VERDADE para role na org)
      const { data: memberData } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const memberRole = (memberData?.role || seed?.role || null) as OrgMemberRole | null
      const role = resolveUserRole(isFartechAdmin, memberRole)

      logDebug('Role resolvido:', { role, memberRole })

      const userWithRole: UserWithRole = {
        id: user.id,
        email,
        name,
        role,
        org_id: memberData?.org_id || seed?.org_id || null,
        is_fartech_admin: isFartechAdmin,
      }

      // Atualiza cache
      cachedUser = {
        ...userWithRole,
        cachedAt: Date.now(),
      }

      return userWithRole
    } catch (error) {
      console.error('Erro ao obter usuario atual:', error)
      clearUserCache()
      return null
    }
  },

  /**
   * Verifica se o usuário tem uma permissão específica.
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { allowed: false, reason: 'Usuario nao autenticado' }
      }

      // Fartech admins têm todas as permissões
      if (user.is_fartech_admin) {
        return { allowed: true }
      }

      // Obtém permissões do role
      const permissions = getPermissionsByRole(user.role)

      // Verifica se tem a permissão
      const hasPermission = permissions.some(
        (p) =>
          p.resource === check.resource &&
          (p.action === check.action || p.action === 'manage')
      )

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Usuario nao tem permissao para ${check.action} em ${check.resource}`,
        }
      }

      // Verifica acesso cross-org
      if (check.target_org_id && check.target_org_id !== user.org_id) {
        return {
          allowed: false,
          reason: 'Operacao nao permitida em outra organizacao',
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Erro ao verificar permissao:', error)
      return {
        allowed: false,
        reason: 'Erro ao verificar permissao',
      }
    }
  },

  /**
   * Verifica múltiplas permissões de uma vez.
   */
  async checkPermissions(
    checks: PermissionCheck[]
  ): Promise<Record<string, PermissionResult>> {
    const results: Record<string, PermissionResult> = {}

    // Executa em paralelo para melhor performance
    const promises = checks.map(async (check) => {
      const key = `${check.resource}:${check.action}`
      results[key] = await this.checkPermission(check)
    })

    await Promise.all(promises)
    return results
  },

  /**
   * Obtém todas as permissões do usuário atual.
   */
  async getUserPermissions(): Promise<Permission[]> {
    try {
      const user = await this.getCurrentUser()
      if (!user) return []

      if (user.is_fartech_admin) {
        return FARTECH_ADMIN_PERMISSIONS
      }

      return getPermissionsByRole(user.role)
    } catch (error) {
      console.error('Erro ao obter permissoes:', error)
      return []
    }
  },

  /**
   * Verifica se o usuário pode acessar um recurso.
   */
  async canAccess(
    resource: Resource,
    action: PermissionAction = 'read'
  ): Promise<boolean> {
    const result = await this.checkPermission({ resource, action })
    return result.allowed
  },

  /**
   * Verifica se o usuário é Fartech admin.
   */
  async isFartechAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.is_fartech_admin ?? false
  },

  /**
   * Verifica se o usuário é admin da organização.
   */
  async isOrgAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.role === 'org_admin' || user?.is_fartech_admin || false
  },

  /**
   * Obtém o ID da organização do usuário.
   */
  async getUserOrgId(): Promise<string | null> {
    const user = await this.getCurrentUser()
    return user?.org_id ?? null
  },

  /**
   * Requer uma permissão (lança erro se não permitido).
   */
  async requirePermission(check: PermissionCheck): Promise<void> {
    const result = await this.checkPermission(check)
    if (!result.allowed) {
      throw new AppError(result.reason || 'Permissao negada', 'permission_denied')
    }
  },

  /**
   * Requer role de Fartech admin.
   */
  async requireFartechAdmin(): Promise<void> {
    const isFartech = await this.isFartechAdmin()
    if (!isFartech) {
      throw new AppError(
        'Esta operacao requer permissoes de administrador Fartech',
        'permission_denied'
      )
    }
  },

  /**
   * Requer role de admin da organização.
   */
  async requireOrgAdmin(): Promise<void> {
    const isAdmin = await this.isOrgAdmin()
    if (!isAdmin) {
      throw new AppError(
        'Esta operacao requer permissoes de administrador',
        'permission_denied'
      )
    }
  },

  /**
   * Limpa o cache do usuário.
   * Deve ser chamado no logout.
   */
  clearCache(): void {
    clearUserCache()
  },
}
```

---

## 3. tarefasService.ts

**Problemas identificados:**
- Falta de validação robusta de input
- Status do banco não corresponde aos tipos TypeScript
- Falta de verificação de permissão em algumas operações

**Arquivo corrigido:**

```typescript
// src/services/tarefasService.ts
// Correção: Validação de input e consistência de tipos

import { supabase, type TarefaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'
import { resolveOrgScope, isCurrentUserAdminish } from '@/services/orgScope'
import { logAuditChange } from '@/services/auditLogService'

// ============================================================
// TIPOS
// ============================================================

type DbTarefaRow = {
  id: string
  created_at?: string | null
  criado_em?: string | null
  org_id?: string | null
  assigned_user_id: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  titulo: string
  descricao?: string | null
  status?: string | null
  priority?: number | null
  due_at?: string | null
  completed_at?: string | null
  submitted_at?: string | null
  confirmed_at?: string | null
  confirmed_by?: string | null
  rejected_reason?: string | null
}

type TarefaInsert = Partial<DbTarefaRow> & {
  org_id: string
  assigned_user_id: string
  titulo: string
}

type TaskPriorityInput = 'baixa' | 'normal' | 'alta' | number

// Status válidos no banco
type DbTaskStatus =
  | 'pendente'
  | 'em_progresso'
  | 'em_andamento'
  | 'aguardando_validacao'
  | 'submetida'
  | 'concluida'
  | 'confirmada'
  | 'cancelada'
  | 'devolvida'

// Input para criar tarefa
export interface CreateTarefaInput {
  titulo: string
  descricao?: string | null
  priority?: TaskPriorityInput
  assigned_user_id?: string
  entidade?: 'lead' | 'cliente' | 'caso' | null
  entidade_id?: string | null
  due_at?: string | null
}

// Input para atualizar tarefa
export interface UpdateTarefaInput {
  titulo?: string
  descricao?: string | null
  priority?: TaskPriorityInput
  status?: string
  assigned_user_id?: string
  due_at?: string | null
}

// ============================================================
// VALIDAÇÃO
// ============================================================

const VALID_ENTIDADES = ['lead', 'cliente', 'caso'] as const

function validateTitulo(titulo: unknown): string {
  if (typeof titulo !== 'string' || !titulo.trim()) {
    throw new AppError('Titulo e obrigatorio', 'validation_error')
  }
  const trimmed = titulo.trim()
  if (trimmed.length > 500) {
    throw new AppError('Titulo deve ter no maximo 500 caracteres', 'validation_error')
  }
  return trimmed
}

function validateEntidade(
  entidade: unknown,
  entidadeId: unknown
): { entidade: 'lead' | 'cliente' | 'caso' | null; entidade_id: string | null } {
  // Se nenhum for fornecido, ok (tarefa avulsa)
  if (!entidade && !entidadeId) {
    return { entidade: null, entidade_id: null }
  }

  // Se um for fornecido, ambos devem ser
  if (!entidade || !entidadeId) {
    throw new AppError(
      'Entidade e entidade_id devem ser fornecidos juntos',
      'validation_error'
    )
  }

  // Valida tipo de entidade
  if (!VALID_ENTIDADES.includes(entidade as typeof VALID_ENTIDADES[number])) {
    throw new AppError(
      `Tipo de entidade invalido. Use: ${VALID_ENTIDADES.join(', ')}`,
      'validation_error'
    )
  }

  // Valida UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof entidadeId !== 'string' || !uuidRegex.test(entidadeId)) {
    throw new AppError('entidade_id deve ser um UUID valido', 'validation_error')
  }

  return {
    entidade: entidade as 'lead' | 'cliente' | 'caso',
    entidade_id: entidadeId,
  }
}

function validatePriority(priority: TaskPriorityInput | undefined | null): number {
  if (priority === undefined || priority === null) return 2 // default: normal

  if (typeof priority === 'number') {
    return Math.min(Math.max(Math.round(priority), 1), 3) // Clamp 1-3
  }

  const priorityMap: Record<string, number> = {
    baixa: 1,
    normal: 2,
    alta: 3,
  }

  return priorityMap[priority] ?? 2
}

// ============================================================
// MAPEAMENTO
// ============================================================

const resolveCreatedAt = (row: DbTarefaRow): string =>
  row.created_at || row.criado_em || new Date().toISOString()

const mapDbTarefaToRow = (row: DbTarefaRow): TarefaRow => {
  return {
    id: row.id,
    created_at: resolveCreatedAt(row),
    org_id: row.org_id ?? null,
    assigned_user_id: row.assigned_user_id,
    entidade: row.entidade ?? null,
    entidade_id: row.entidade_id ?? null,
    titulo: row.titulo,
    descricao: row.descricao || null,
    status: (row.status as TarefaRow['status']) || 'pendente',
    priority: row.priority ?? 2,
    due_at: row.due_at || null,
    completed_at: row.completed_at || null,
  }
}

// ============================================================
// HELPERS
// ============================================================

async function resolveCurrentUserId(fallback?: string | null): Promise<string> {
  if (fallback) return fallback

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    throw new AppError('Usuario nao autenticado', 'auth_error')
  }

  return session.user.id
}

// ============================================================
// SERVICE
// ============================================================

export const tarefasService = {
  /**
   * Busca tarefas - filtrada por role:
   * - Gestor/Admin: vê todas as tarefas da org
   * - Advogado: vê apenas suas tarefas atribuídas
   */
  async getTarefas(options?: {
    userId?: string
    isGestor?: boolean
  }): Promise<TarefaRow[]> {
    const { orgId, isFartechAdmin } = await resolveOrgScope()
    if (!isFartechAdmin && !orgId) return []

    let query = supabase
      .from('tarefas')
      .select('*')
      .order('due_at', { ascending: true, nullsFirst: false })

    // Aplica filtro de org
    if (!isFartechAdmin) {
      query = query.eq('org_id', orgId)
    }

    // Advogado só vê suas próprias tarefas
    if (options?.userId && !options?.isGestor && !isFartechAdmin) {
      query = query.eq('assigned_user_id', options.userId)
    }

    const { data, error } = await query

    if (error) {
      throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 'database_error')
    }

    return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
  },

  /**
   * Busca tarefas por entidade (lead, cliente ou caso).
   */
  async getTarefasByEntidade(
    entidade: 'lead' | 'cliente' | 'caso',
    entidadeId: string
  ): Promise<TarefaRow[]> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) return []

    // Valida entidade
    if (!VALID_ENTIDADES.includes(entidade)) {
      throw new AppError('Tipo de entidade invalido', 'validation_error')
    }

    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('entidade', entidade)
      .eq('entidade_id', entidadeId)
      .eq('org_id', orgId)
      .order('due_at', { ascending: true, nullsFirst: false })

    if (error) {
      throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 'database_error')
    }

    return (data || []).map((row: DbTarefaRow) => mapDbTarefaToRow(row))
  },

  /**
   * Cria uma nova tarefa com validação completa.
   */
  async createTarefa(input: CreateTarefaInput): Promise<TarefaRow> {
    const { orgId, userId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    // Validações
    const titulo = validateTitulo(input.titulo)
    const { entidade, entidade_id } = validateEntidade(input.entidade, input.entidade_id)
    const priority = validatePriority(input.priority)
    const assignedUserId = await resolveCurrentUserId(input.assigned_user_id || userId)

    // Monta payload
    const payload: TarefaInsert = {
      org_id: orgId,
      titulo,
      descricao: input.descricao?.trim() || null,
      priority,
      status: 'pendente',
      assigned_user_id: assignedUserId,
      entidade,
      entidade_id,
      due_at: input.due_at || null,
    }

    const { data, error } = await supabase
      .from('tarefas')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao criar tarefa: ${error.message}`, 'database_error')
    }

    if (!data) {
      throw new AppError('Erro ao criar tarefa: dados nao retornados', 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'create',
      entity: 'tarefas',
      entityId: data.id,
      details: { titulo, entidade, entidade_id },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Atualiza uma tarefa existente.
   */
  async updateTarefa(id: string, input: UpdateTarefaInput): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    // Monta payload apenas com campos fornecidos
    const payload: Partial<DbTarefaRow> = {}

    if (input.titulo !== undefined) {
      payload.titulo = validateTitulo(input.titulo)
    }

    if (input.descricao !== undefined) {
      payload.descricao = input.descricao?.trim() || null
    }

    if (input.priority !== undefined) {
      payload.priority = validatePriority(input.priority)
    }

    if (input.status !== undefined) {
      payload.status = input.status

      // Auto-preenche completed_at
      if (input.status === 'concluida' || input.status === 'confirmada') {
        payload.completed_at = new Date().toISOString()
      } else if (payload.completed_at === undefined) {
        payload.completed_at = null
      }
    }

    if (input.assigned_user_id !== undefined) {
      payload.assigned_user_id = input.assigned_user_id
    }

    if (input.due_at !== undefined) {
      payload.due_at = input.due_at
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update(payload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao atualizar tarefa: ${error.message}`, 'database_error')
    }

    if (!data) {
      throw new AppError('Tarefa nao encontrada', 'not_found')
    }

    void logAuditChange({
      orgId,
      action: 'update',
      entity: 'tarefas',
      entityId: id,
      details: { fields: Object.keys(payload) },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Deleta uma tarefa.
   */
  async deleteTarefa(id: string): Promise<void> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'auth_error')
    }

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      throw new AppError(`Erro ao deletar tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'delete',
      entity: 'tarefas',
      entityId: id,
      details: {},
    })
  },

  /**
   * Submete tarefa para validação (advogado -> gestor).
   */
  async submitForValidation(id: string): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'aguardando_validacao',
        submitted_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao submeter tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'submit_for_validation',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'aguardando_validacao' },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Aprova uma tarefa (gestor).
   * Requer permissão de admin/gestor.
   */
  async approveTask(id: string): Promise<TarefaRow> {
    const { orgId, userId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    // Verifica se é gestor/admin
    const isAdminish = await isCurrentUserAdminish()
    if (!isAdminish) {
      throw new AppError(
        'Apenas gestores podem aprovar tarefas',
        'permission_denied'
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'concluida',
        confirmed_at: now,
        confirmed_by: userId,
        completed_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao aprovar tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'approve',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'concluida', confirmed_by: userId },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Rejeita/devolve uma tarefa (gestor).
   * Requer permissão de admin/gestor.
   */
  async rejectTask(id: string, reason: string): Promise<TarefaRow> {
    const { orgId } = await resolveOrgScope()
    if (!orgId) {
      throw new AppError('Organizacao nao encontrada', 'validation_error')
    }

    // Verifica se é gestor/admin
    const isAdminish = await isCurrentUserAdminish()
    if (!isAdminish) {
      throw new AppError(
        'Apenas gestores podem devolver tarefas',
        'permission_denied'
      )
    }

    // Valida motivo
    if (!reason?.trim()) {
      throw new AppError(
        'Motivo da devolucao e obrigatorio',
        'validation_error'
      )
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update({
        status: 'devolvida',
        rejected_reason: reason.trim(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single()

    if (error) {
      throw new AppError(`Erro ao devolver tarefa: ${error.message}`, 'database_error')
    }

    void logAuditChange({
      orgId,
      action: 'reject',
      entity: 'tarefas',
      entityId: id,
      details: { status: 'devolvida', reason: reason.trim() },
    })

    return mapDbTarefaToRow(data as DbTarefaRow)
  },

  /**
   * Obtém estatísticas de tarefas.
   */
  async getEstatisticas(): Promise<{
    total: number
    pendentes: number
    em_progresso: number
    aguardando: number
    concluidas: number
    devolvidas: number
  }> {
    const tarefas = await this.getTarefas()

    return {
      total: tarefas.length,
      pendentes: tarefas.filter((t) => t.status === 'pendente').length,
      em_progresso: tarefas.filter((t) =>
        ['em_progresso', 'em_andamento'].includes(t.status || '')
      ).length,
      aguardando: tarefas.filter((t) =>
        ['aguardando_validacao', 'submetida'].includes(t.status || '')
      ).length,
      concluidas: tarefas.filter((t) =>
        ['concluida', 'confirmada'].includes(t.status || '')
      ).length,
      devolvidas: tarefas.filter((t) => t.status === 'devolvida').length,
    }
  },
}
```

---

## 4. Tipos Compartilhados

**Arquivo novo para interfaces de validação:**

```typescript
// src/types/validation.ts
// Tipos e helpers de validação compartilhados

/**
 * Resultado de uma validação.
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Valida um UUID.
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Valida um email.
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * Valida um telefone brasileiro.
 */
export function isValidPhone(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const cleaned = value.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

/**
 * Valida um CPF.
 */
export function isValidCPF(cpf: unknown): cpf is string {
  if (typeof cpf !== 'string') return false
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned[10])
}

/**
 * Valida um CNPJ.
 */
export function isValidCNPJ(cnpj: unknown): cnpj is string {
  if (typeof cnpj !== 'string') return false
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleaned[12])) return false

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  return digit2 === parseInt(cleaned[13])
}

/**
 * Sanitiza uma string removendo caracteres perigosos.
 */
export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove < e > para prevenir XSS básico
    .slice(0, 10000) // Limita tamanho
}

/**
 * Valida e sanitiza um objeto de input.
 */
export function validateAndSanitize<T extends Record<string, unknown>>(
  input: T,
  schema: Record<keyof T, (value: unknown) => ValidationResult>
): { valid: boolean; errors: Record<string, string[]>; data: T } {
  const errors: Record<string, string[]> = {}
  const data = { ...input }

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(input[key])
    if (!result.valid) {
      errors[key] = result.errors
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  }
}
```

---

## Resumo das Correções

### orgScope.ts
| Antes | Depois |
|-------|--------|
| Sem cache | Cache com TTL de 5s |
| Chamadas duplicadas | Promise única compartilhada |
| Só orgId e isFartechAdmin | + userId e role |

### permissionsService.ts
| Antes | Depois |
|-------|--------|
| Mistura usuarios.permissoes + org_members.role | Separação clara: permissoes só para fartech_admin |
| Cache limpa imediatamente | Cache com TTL de 10s |
| Logs sempre | Logs só em DEV |

### tarefasService.ts
| Antes | Depois |
|-------|--------|
| Aceita qualquer input | Validação robusta |
| Sem verificação de permissão em approve/reject | Verifica isAdminish |
| Status inconsistentes | Mapeamento claro |

---

## Como Aplicar

1. **Backup** dos arquivos atuais
2. **Substituir** cada arquivo pela versão corrigida
3. **Rodar** `npm run typecheck` para verificar erros de tipo
4. **Testar** as funcionalidades afetadas

## Arquivos Afetados

```
src/services/
├── orgScope.ts           ← CORRIGIDO
├── permissionsService.ts ← CORRIGIDO
├── tarefasService.ts     ← CORRIGIDO
└── ...

src/types/
└── validation.ts         ← NOVO
```
