/**
 * @fileoverview Mapeamento entre tipos do Frontend e do Banco de Dados
 * @version 1.0.0
 * @date 2026-02-04
 * 
 * Este arquivo resolve as inconsistências entre os tipos usados no frontend
 * (domain.ts) e os enums do PostgreSQL (database.types.ts).
 * 
 * ANÁLISE DE INCONSISTÊNCIAS ENCONTRADAS:
 * 
 * | Campo           | Frontend (domain.ts)                  | DB (PostgreSQL)                               |
 * |-----------------|---------------------------------------|-----------------------------------------------|
 * | leads.status    | novo, em_contato, qualificado...      | novo, em_triagem, qualificado...              |
 * | casos.status    | ativo, suspenso, encerrado            | aberto, triagem, negociacao, contrato...      |
 * | clientes.status | ativo, em_risco, inativo              | (derivado de casos, não é enum no DB)         |
 * 
 * ESTRATÉGIA:
 * - Usar tipos do DB como fonte da verdade (database.types.ts)
 * - Criar mappers para conversão Frontend ↔ DB
 * - Manter compatibilidade com código existente via aliases
 */

import type { 
  LeadStatus as DbLeadStatus,
  CaseStatus as DbCaseStatus,
  TaskStatus as DbTaskStatus,
  UserRole as DbUserRole,
} from './enums';

// ============================================================================
// TIPOS LEGADOS DO FRONTEND (para compatibilidade)
// ============================================================================

/** @deprecated Use DbLeadStatus de enums.ts */
export type LegacyLeadStatus = 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido';

/** @deprecated Use DbCaseStatus de enums.ts */
export type LegacyCasoStatus = 'ativo' | 'suspenso' | 'encerrado';

/** Derivado de casos (não é enum no DB) */
export type ClienteStatus = 'ativo' | 'em_risco' | 'inativo';

// ============================================================================
// MAPEAMENTO: LEAD STATUS
// ============================================================================

/**
 * Converte status de lead do Frontend para DB
 * 
 * Frontend → DB:
 * - novo → novo
 * - em_contato → em_triagem
 * - qualificado → qualificado
 * - proposta → qualificado (não existe no DB, usa qualificado)
 * - ganho → convertido
 * - perdido → perdido
 */
export function mapLeadStatusToDb(frontendStatus: LegacyLeadStatus): DbLeadStatus {
  const mapping: Record<LegacyLeadStatus, DbLeadStatus> = {
    novo: 'novo',
    em_contato: 'em_triagem',
    qualificado: 'qualificado',
    proposta: 'qualificado', // Aproximação - DB não tem 'proposta'
    ganho: 'convertido',
    perdido: 'perdido',
  };
  return mapping[frontendStatus];
}

/**
 * Converte status de lead do DB para Frontend
 * 
 * DB → Frontend:
 * - novo → novo
 * - em_triagem → em_contato
 * - qualificado → qualificado
 * - nao_qualificado → perdido (aproximação)
 * - convertido → ganho
 * - perdido → perdido
 */
export function mapLeadStatusToFrontend(dbStatus: DbLeadStatus): LegacyLeadStatus {
  const mapping: Record<DbLeadStatus, LegacyLeadStatus> = {
    novo: 'novo',
    em_triagem: 'em_contato',
    qualificado: 'qualificado',
    nao_qualificado: 'perdido', // Aproximação
    convertido: 'ganho',
    perdido: 'perdido',
  };
  return mapping[dbStatus];
}

// ============================================================================
// MAPEAMENTO: CASO STATUS
// ============================================================================

/**
 * Converte status de caso do Frontend para DB
 * 
 * Frontend → DB:
 * - ativo → andamento (ou array de status ativos)
 * - suspenso → arquivado (aproximação)
 * - encerrado → encerrado
 */
export function mapCasoStatusToDb(frontendStatus: LegacyCasoStatus): DbCaseStatus {
  const mapping: Record<LegacyCasoStatus, DbCaseStatus> = {
    ativo: 'andamento',
    suspenso: 'arquivado',
    encerrado: 'encerrado',
  };
  return mapping[frontendStatus];
}

/**
 * Retorna array de status do DB que correspondem ao status do Frontend
 * 
 * Usado para queries: WHERE status IN (...)
 */
export function mapCasoStatusToDbArray(frontendStatus: LegacyCasoStatus): DbCaseStatus[] {
  const mapping: Record<LegacyCasoStatus, DbCaseStatus[]> = {
    ativo: ['aberto', 'triagem', 'negociacao', 'contrato', 'andamento'],
    suspenso: ['arquivado'],
    encerrado: ['encerrado'],
  };
  return mapping[frontendStatus];
}

/**
 * Converte status de caso do DB para Frontend
 * 
 * DB → Frontend:
 * - aberto, triagem, negociacao, contrato, andamento → ativo
 * - arquivado → suspenso
 * - encerrado → encerrado
 */
export function mapCasoStatusToFrontend(dbStatus: DbCaseStatus): LegacyCasoStatus {
  const activeStatuses: DbCaseStatus[] = ['aberto', 'triagem', 'negociacao', 'contrato', 'andamento'];
  
  if (activeStatuses.includes(dbStatus)) return 'ativo';
  if (dbStatus === 'arquivado') return 'suspenso';
  if (dbStatus === 'encerrado') return 'encerrado';
  
  return 'ativo'; // fallback
}

// ============================================================================
// MAPEAMENTO: CLIENTE STATUS (Calculado)
// ============================================================================

/**
 * Calcula o status do cliente baseado nos seus casos
 * 
 * Regras:
 * - 0 casos → inativo
 * - Tem caso com SLA crítico → em_risco
 * - Tem casos ativos → ativo
 */
export function calculateClienteStatus(
  caseCount: number, 
  hasCritico: boolean
): ClienteStatus {
  if (caseCount === 0) return 'inativo';
  if (hasCritico) return 'em_risco';
  return 'ativo';
}

// ============================================================================
// VALIDADORES
// ============================================================================

/**
 * Valida se um valor é um status de lead válido do DB
 */
export function isValidDbLeadStatus(value: string): value is DbLeadStatus {
  const validStatuses: DbLeadStatus[] = [
    'novo', 'em_triagem', 'qualificado', 'nao_qualificado', 'convertido', 'perdido'
  ];
  return validStatuses.includes(value as DbLeadStatus);
}

/**
 * Valida se um valor é um status de caso válido do DB
 */
export function isValidDbCaseStatus(value: string): value is DbCaseStatus {
  const validStatuses: DbCaseStatus[] = [
    'aberto', 'triagem', 'negociacao', 'contrato', 'andamento', 'encerrado', 'arquivado'
  ];
  return validStatuses.includes(value as DbCaseStatus);
}

// ============================================================================
// EXPORTS PARA COMPATIBILIDADE
// ============================================================================

// Re-exporta tipos do DB como padrão
export type { 
  DbLeadStatus as LeadStatus,
  DbCaseStatus as CaseStatus,
  DbTaskStatus as TaskStatus,
  DbUserRole as UserRole,
};
