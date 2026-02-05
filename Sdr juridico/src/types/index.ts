/**
 * @fileoverview Barrel file para exportação de todos os types
 * @version 1.0.1
 * @date 2026-02-05
 */

// Database types (gerado pelo Supabase)
export type { Database, Json } from './database.types';

// Enums do sistema (do Supabase)
export type {
  CaseStatus,
  LeadStatus,
  TaskStatus,
  UserRole,
  ChannelType,
  DocVisibility,
} from './enums';

// Domain types simples
export type {
  Lead as DomainLead,
  Caso as DomainCaso,
  Cliente as DomainCliente,
  Documento as DomainDocumento,
} from './domain';

// Organization types
export * from './organization';

// Validation types
export * from './validation';
