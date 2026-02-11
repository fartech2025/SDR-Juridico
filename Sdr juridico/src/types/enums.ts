/**
 * @fileoverview Documentação e exportação de todos os enums do sistema SDR Jurídico
 * @version 1.0.0
 * @date 2026-02-04
 * 
 * Este arquivo documenta todos os enums utilizados no banco de dados PostgreSQL
 * e fornece tipos TypeScript correspondentes para uso no frontend.
 * 
 * IMPORTANTE: Este arquivo é gerado a partir do schema do Supabase.
 * Para atualizar, execute: npx supabase gen types typescript --project-id <id>
 */

import type { Database } from './database.types';

// ============================================================================
// EXTRAIR ENUMS DO DATABASE.TYPES
// ============================================================================

export type CaseStatus = Database['public']['Enums']['case_status'];
export type ChannelType = Database['public']['Enums']['channel_type'];
export type DocVisibility = Database['public']['Enums']['doc_visibility'];
export type LeadStatus = Database['public']['Enums']['lead_status'];
export type TaskStatus = Database['public']['Enums']['task_status'];
export type UserRole = Database['public']['Enums']['user_role'];

// ============================================================================
// CONSTANTES DE ENUMS (para uso em selects, validações, etc.)
// ============================================================================

/**
 * Status de Casos/Processos Jurídicos
 * 
 * FLUXO TÍPICO:
 * aberto → triagem → negociacao → contrato → andamento → encerrado
 *                                                       ↓
 *                                                  arquivado
 */
export const CASE_STATUS = {
  ABERTO: 'aberto',
  TRIAGEM: 'triagem',
  NEGOCIACAO: 'negociacao',
  CONTRATO: 'contrato',
  ANDAMENTO: 'andamento',
  ENCERRADO: 'encerrado',
  ARQUIVADO: 'arquivado',
} as const;

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  aberto: 'Aberto',
  triagem: 'Em Triagem',
  negociacao: 'Negociação',
  contrato: 'Contrato',
  andamento: 'Em Andamento',
  encerrado: 'Encerrado',
  arquivado: 'Arquivado',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  aberto: 'blue',
  triagem: 'yellow',
  negociacao: 'orange',
  contrato: 'purple',
  andamento: 'cyan',
  encerrado: 'green',
  arquivado: 'gray',
};

export const CASE_STATUS_LIST: CaseStatus[] = [
  'aberto',
  'triagem',
  'negociacao',
  'contrato',
  'andamento',
  'encerrado',
  'arquivado',
];

/**
 * Canais de Comunicação
 * 
 * Define a origem do contato/lead
 */
export const CHANNEL_TYPE = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  TELEFONE: 'telefone',
  WEBCHAT: 'webchat',
  OUTRO: 'outro',
} as const;

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  telefone: 'Telefone',
  webchat: 'Chat do Site',
  outro: 'Outro',
};

export const CHANNEL_TYPE_ICONS: Record<ChannelType, string> = {
  whatsapp: '📱',
  email: '📧',
  telefone: '📞',
  webchat: '💬',
  outro: '📝',
};

export const CHANNEL_TYPE_LIST: ChannelType[] = [
  'whatsapp',
  'email',
  'telefone',
  'webchat',
  'outro',
];

/**
 * Visibilidade de Documentos
 * 
 * Controla quem pode ver o documento
 * - privado: Apenas o criador e admins
 * - interno: Todos os membros da organização
 * - cliente: Visível também para o cliente
 */
export const DOC_VISIBILITY = {
  PRIVADO: 'privado',
  INTERNO: 'interno',
  CLIENTE: 'cliente',
} as const;

export const DOC_VISIBILITY_LABELS: Record<DocVisibility, string> = {
  privado: 'Privado',
  interno: 'Interno',
  cliente: 'Cliente',
};

export const DOC_VISIBILITY_DESCRIPTIONS: Record<DocVisibility, string> = {
  privado: 'Apenas você e administradores podem ver',
  interno: 'Todos da organização podem ver',
  cliente: 'Cliente também pode visualizar',
};

export const DOC_VISIBILITY_LIST: DocVisibility[] = [
  'privado',
  'interno',
  'cliente',
];

/**
 * Status de Leads
 * 
 * FLUXO TÍPICO:
 * novo → em_triagem → qualificado → convertido
 *                  ↓           ↓
 *          nao_qualificado   perdido
 */
export const LEAD_STATUS = {
  NOVO: 'novo',
  EM_TRIAGEM: 'em_triagem',
  QUALIFICADO: 'qualificado',
  PROPOSTA: 'proposta',
  NAO_QUALIFICADO: 'nao_qualificado',
  CONVERTIDO: 'convertido',
  PERDIDO: 'perdido',
} as const;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  em_triagem: 'Em Triagem',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  nao_qualificado: 'Não Qualificado',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  novo: 'blue',
  em_triagem: 'yellow',
  qualificado: 'green',
  proposta: 'purple',
  nao_qualificado: 'red',
  convertido: 'purple',
  perdido: 'gray',
};

export const LEAD_STATUS_LIST: LeadStatus[] = [
  'novo',
  'em_triagem',
  'qualificado',
  'proposta',
  'nao_qualificado',
  'convertido',
  'perdido',
];

/**
 * Status de Tarefas
 * 
 * FLUXO TÍPICO:
 * pendente → em_andamento → concluida
 *         ↓              ↓
 *    devolvida    aguardando_validacao
 *         ↓              ↓
 *    cancelada      concluida
 */
export const TASK_STATUS = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
  DEVOLVIDA: 'devolvida',
  AGUARDANDO_VALIDACAO: 'aguardando_validacao',
} as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  devolvida: 'Devolvida',
  aguardando_validacao: 'Aguardando Validação',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pendente: 'gray',
  em_andamento: 'blue',
  concluida: 'green',
  cancelada: 'red',
  devolvida: 'orange',
  aguardando_validacao: 'yellow',
};

export const TASK_STATUS_LIST: TaskStatus[] = [
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada',
  'devolvida',
  'aguardando_validacao',
];

/**
 * Roles de Usuário (Hierarquia de Permissões)
 * 
 * HIERARQUIA (maior → menor):
 * admin → gestor → advogado → associado → secretaria → leitura
 * 
 * PERMISSÕES:
 * - admin: Acesso total à organização
 * - gestor: Gerenciamento de equipe e casos
 * - advogado: CRUD completo em casos, clientes, docs
 * - associado: Acesso apenas a casos atribuídos
 * - secretaria: Agendamentos, tarefas básicas
 * - leitura: Somente visualização
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  GESTOR: 'gestor',
  ADVOGADO: 'advogado',
  ASSOCIADO: 'associado',
  SECRETARIA: 'secretaria',
  LEITURA: 'leitura',
} as const;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  advogado: 'Advogado',
  associado: 'Advogado Associado',
  secretaria: 'Secretária',
  leitura: 'Somente Leitura',
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total à organização, incluindo configurações e faturamento',
  gestor: 'Gerenciamento de equipe, casos e relatórios',
  advogado: 'Criar e gerenciar casos, clientes e documentos',
  associado: 'Acesso limitado aos casos que foram atribuídos',
  secretaria: 'Gerenciar agendamentos e tarefas administrativas',
  leitura: 'Apenas visualização de dados, sem edição',
};

export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  gestor: 80,
  advogado: 60,
  associado: 40,
  secretaria: 30,
  leitura: 10,
};

export const USER_ROLE_LIST: UserRole[] = [
  'admin',
  'gestor',
  'advogado',
  'associado',
  'secretaria',
  'leitura',
];

// ============================================================================
// FUNÇÕES HELPERS
// ============================================================================

/**
 * Verifica se um role tem permissão igual ou superior a outro
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return USER_ROLE_HIERARCHY[userRole] >= USER_ROLE_HIERARCHY[requiredRole];
}

/**
 * Verifica se um role é administrativo (admin ou gestor)
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'gestor';
}

/**
 * Verifica se um role pode criar/editar casos
 */
export function canManageCases(role: UserRole): boolean {
  return hasRolePermission(role, 'associado');
}

/**
 * Verifica se um role pode ver todos os casos da org
 */
export function canViewAllCases(role: UserRole): boolean {
  return hasRolePermission(role, 'advogado');
}

/**
 * Retorna os roles que um admin pode atribuir
 * (não pode criar admin igual ou superior)
 */
export function getAssignableRoles(currentRole: UserRole): UserRole[] {
  const currentLevel = USER_ROLE_HIERARCHY[currentRole];
  return USER_ROLE_LIST.filter(role => USER_ROLE_HIERARCHY[role] < currentLevel);
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Opção para select/dropdown
 */
export interface EnumOption<T extends string> {
  value: T;
  label: string;
  color?: string;
  icon?: string;
  description?: string;
}

/**
 * Gera opções para select a partir de um enum
 */
export function enumToOptions<T extends string>(
  values: T[],
  labels: Record<T, string>,
  colors?: Record<T, string>,
  icons?: Record<T, string>,
  descriptions?: Record<T, string>
): EnumOption<T>[] {
  return values.map(value => ({
    value,
    label: labels[value],
    color: colors?.[value],
    icon: icons?.[value],
    description: descriptions?.[value],
  }));
}

// Opções prontas para uso em selects
export const caseStatusOptions = enumToOptions(CASE_STATUS_LIST, CASE_STATUS_LABELS, CASE_STATUS_COLORS);
export const channelTypeOptions = enumToOptions(CHANNEL_TYPE_LIST, CHANNEL_TYPE_LABELS, undefined, CHANNEL_TYPE_ICONS);
export const docVisibilityOptions = enumToOptions(DOC_VISIBILITY_LIST, DOC_VISIBILITY_LABELS, undefined, undefined, DOC_VISIBILITY_DESCRIPTIONS);
export const leadStatusOptions = enumToOptions(LEAD_STATUS_LIST, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS);
export const taskStatusOptions = enumToOptions(TASK_STATUS_LIST, TASK_STATUS_LABELS, TASK_STATUS_COLORS);
export const userRoleOptions = enumToOptions(USER_ROLE_LIST, USER_ROLE_LABELS, undefined, undefined, USER_ROLE_DESCRIPTIONS);
