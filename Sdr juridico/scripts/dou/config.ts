// scripts/dou/config.ts
import { config } from 'dotenv'
// Load .env.local first (overrides), then .env as fallback
config({ path: '.env.local' })
config({ path: '.env' })

export const DOU_CONFIG = {
  // Supabase (accepts both SUPABASE_URL and VITE_SUPABASE_URL)
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // INLABS (para CRON diário - opcional)
  inlabsEmail: process.env.INLABS_EMAIL || '',
  inlabsPassword: process.env.INLABS_PASSWORD || '',

  // API pública DOU (para busca histórica, sem auth)
  douSearchUrl: 'https://www.in.gov.br/consulta/-/buscar/dou',

  // Leiturajornal (alternativa ao INLABS, sem auth)
  leiturajornalUrl: 'https://www.in.gov.br/leiturajornal',

  // Configurações
  secao: 'do3',
  maxPaginasBuscaHistorica: 5,
  retryAttempts: 3,
  retryDelayMs: 2000,

  // Logs
  logDir: process.env.DOU_LOG_DIR || './logs/dou',
  debugDump: process.env.DOU_DEBUG_DUMP === '1' || process.env.DOU_DEBUG_DUMP === 'true',
}
