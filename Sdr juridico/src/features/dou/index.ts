// src/features/dou/index.ts
// Barrel export - ponto de entrada unico para o modulo DOU

// Componentes
export { CasoDouSection } from './components/CasoDouSection'
export { DOUSearchModal } from './components/DOUSearchModal'
export { DOUMonitorConfig } from './components/DOUMonitorConfig'

// Hook
export { useDOU } from './hooks/useDOU'

// Service
export { douService } from './services/douService'

// Validacao
export { validateSearchResponse, validatePublicacoes } from './validation'
