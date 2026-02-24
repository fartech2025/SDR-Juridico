// Chama o Bun/Node scraper server local (porta 3001)
import type { ScraperProcesso } from '@/types/caseIntelligence'

const SCRAPER_URL = '/scraper-api'

export interface ScraperStatus {
  online: boolean
  porta: number
  versao: string
  cache: { size: number }
  timestamp: string
  mni_configurado?: boolean
  mni_tribunais?: number
  eproc_configurado?: boolean
  eproc_instancias?: number
}

/** Verifica se o scraper server está rodando */
export async function verificarStatus(): Promise<ScraperStatus | null> {
  try {
    const res = await fetch(`${SCRAPER_URL}/status`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * Busca processo por número CNJ via MNI (PJe) — requer MNI_CPF e MNI_SENHA em scraper-server/.env.
 * Retorna null se: tribunal não suportado (422), MNI não configurado (503), processo não encontrado.
 */
export async function buscarProcessoMNI(numero: string): Promise<ScraperProcesso | null> {
  try {
    const res = await fetch(`${SCRAPER_URL}/mni/processo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero }),
      signal: AbortSignal.timeout(30_000), // SOAP pode demorar
    })
    // 422 = tribunal sem MNI, 503 = MNI não configurado — fallback silencioso
    if (res.status === 422 || res.status === 503 || !res.ok) return null
    const data = await res.json()
    return data?.processo ?? null
  } catch {
    return null
  }
}

export interface ConfigurarMNIResult {
  sucesso: boolean
  mensagem: string
  tribunal_testado?: string
  mni_configurado?: boolean
  mni_tribunais?: number
  erro?: string
  // 2FA
  aguardando_otp?: boolean
  session_id?: string
}

/**
 * Configura as credenciais PJe/MNI no scraper-server local.
 * Testa o login no TJMG antes de salvar — retorna erro se credenciais inválidas.
 * Persiste no arquivo .env do scraper-server e ativa em memória imediatamente.
 */
export async function configurarMNI(cpf: string, senha: string): Promise<ConfigurarMNIResult> {
  try {
    const res = await fetch(`${SCRAPER_URL}/configurar/mni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha }),
      signal: AbortSignal.timeout(40_000),
    })
    const data = await res.json() as Record<string, unknown>
    if (!res.ok) {
      return { sucesso: false, mensagem: '', erro: (data?.erro as string) ?? 'Erro ao configurar' }
    }
    // 2FA necessário
    if (data.aguardando_otp) {
      return {
        sucesso:        false,
        mensagem:       (data.mensagem as string) ?? '',
        aguardando_otp: true,
        session_id:     data.session_id as string,
      }
    }
    return {
      sucesso:          true,
      mensagem:         (data.mensagem as string) ?? '',
      tribunal_testado: data.tribunal_testado as string | undefined,
      mni_configurado:  data.mni_configurado as boolean | undefined,
      mni_tribunais:    data.mni_tribunais as number | undefined,
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: '',
      erro: err?.name === 'TimeoutError' ? 'Timeout — servidor demorou mais de 40s' : 'Scraper offline',
    }
  }
}

/** Envia código 2FA para completar o login PJe após aguardando_otp */
export async function submeterOTP(sessionId: string, codigo: string): Promise<ConfigurarMNIResult> {
  try {
    const res = await fetch(`${SCRAPER_URL}/configurar/mni/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, codigo }),
      signal: AbortSignal.timeout(20_000),
    })
    const data = await res.json() as Record<string, unknown>
    if (!res.ok) {
      return { sucesso: false, mensagem: '', erro: (data?.erro as string) ?? 'Código inválido' }
    }
    return {
      sucesso:         true,
      mensagem:        (data.mensagem as string) ?? '',
      mni_configurado: data.mni_configurado as boolean | undefined,
      mni_tribunais:   data.mni_tribunais as number | undefined,
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: '',
      erro: err?.name === 'TimeoutError' ? 'Timeout ao verificar código' : 'Scraper offline',
    }
  }
}

export interface ConfigurarEprocResult {
  sucesso: boolean
  mensagem: string
  eproc_configurado?: boolean
  erro?: string
}

/** Configura credenciais separadas para o eProc (quando senha for diferente do PJe) */
export async function configurarEproc(cpf: string, senha: string): Promise<ConfigurarEprocResult> {
  try {
    const res = await fetch(`${SCRAPER_URL}/configurar/eproc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha }),
      signal: AbortSignal.timeout(40_000),
    })
    const data = await res.json() as Record<string, unknown>
    if (!res.ok) {
      return { sucesso: false, mensagem: '', erro: (data?.erro as string) ?? 'Erro ao configurar' }
    }
    return {
      sucesso:           true,
      mensagem:          (data.mensagem as string) ?? '',
      eproc_configurado: data.eproc_configurado as boolean | undefined,
    }
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: '',
      erro: err?.name === 'TimeoutError' ? 'Timeout — servidor demorou mais de 40s' : 'Scraper offline',
    }
  }
}

export interface AdvogadoProcessosResult {
  processos: ScraperProcesso[]
  total: number
  gerado_em: string
  autenticacao: 'oauth2-keycloak' | 'falhou'
  tribunais: { tribunal: string; total: number; metodo?: string; erro?: string }[]
  datajud_oab?: number
  eproc_total?: number
  erro?: string
}

/**
 * Lista todos os processos do advogado em todos os tribunais PJe configurados.
 * Usa MNI_CPF + MNI_SENHA do scraper-server para autenticar via PDPJ-Br SSO.
 * Opcionalmente inclui busca DataJud por OAB se oab+uf forem informados.
 */
export async function listarProcessosAdvogado(
  params: { oab?: string; uf?: string } = {}
): Promise<AdvogadoProcessosResult> {
  try {
    const res = await fetch(`${SCRAPER_URL}/advogado/processos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(120_000), // pode demorar: 28 tribunais em paralelo
    })

    if (res.status === 503) {
      return {
        processos: [], total: 0, gerado_em: new Date().toISOString(),
        autenticacao: 'falhou', tribunais: [],
        erro: 'MNI não configurado — adicione MNI_CPF e MNI_SENHA em scraper-server/.env',
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>
      return {
        processos: [], total: 0, gerado_em: new Date().toISOString(),
        autenticacao: 'falhou', tribunais: [],
        erro: (err?.erro as string) ?? 'Erro no scraper',
      }
    }

    return res.json()
  } catch (err: any) {
    return {
      processos: [], total: 0, gerado_em: new Date().toISOString(),
      autenticacao: 'falhou', tribunais: [],
      erro: err?.name === 'TimeoutError' ? 'Timeout (>120s) — muitos tribunais' : 'Scraper offline',
    }
  }
}

/** Busca processos por CPF em todos os tribunais via scraper local */
export async function buscarPorCpf(cpf: string): Promise<{
  processos: ScraperProcesso[]
  total: number
  gerado_em: string
  erro?: string
}> {
  try {
    const res = await fetch(`${SCRAPER_URL}/cpf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(60_000), // scrapers podem ser lentos
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { processos: [], total: 0, gerado_em: new Date().toISOString(), erro: err?.erro ?? 'Erro no scraper' }
    }

    return res.json()
  } catch (err: any) {
    // Scraper offline — não bloquear a análise
    return {
      processos: [],
      total: 0,
      gerado_em: new Date().toISOString(),
      erro: err?.name === 'TimeoutError' ? 'Scraper offline (timeout)' : 'Scraper offline',
    }
  }
}
