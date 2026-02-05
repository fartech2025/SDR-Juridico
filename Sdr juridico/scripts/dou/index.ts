// scripts/dou/index.ts
// Barrel export de todos os módulos DOU
export { DOU_CONFIG } from './config'
export { logger } from './logger'
export { matchTermo, classificarTipo } from './matching-engine'
export { searchDOUPublico, downloadViaLeiturajornal } from './dou-search-client'
export {
  supabase,
  salvarPublicacao,
  criarNotificacao,
  inserirTimeline,
  logSync,
  getTermosMonitorados,
  getCasosAtivosComProcesso,
} from './persistence'
export type { DOUHit, DOUMatchResult, DOUTermo, DOUTipoPublicacao } from './types'
export {
  validateDOUHits,
  validateLeiturajornalItems,
  validateSearchResult,
  validateBeforePersist,
} from './validation'
