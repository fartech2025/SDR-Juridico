import { supabase } from '@/lib/supabaseClient'
import type { ScraperProcesso } from '@/types/caseIntelligence'
import type { ProcessoDataJud } from '@/services/datajudService'

export function derivarArea(classe?: string): string {
  if (!classe) return 'civel'
  const c = classe.toLowerCase()
  if (c.includes('trabalh') || c.includes('reclamação') || c.includes('reclamacao')) return 'trabalhista'
  if (c.includes('penal') || c.includes('criminal')) return 'criminal'
  if (c.includes('tributar') || c.includes('fiscal')) return 'tributario'
  if (c.includes('previdenci') || c.includes('benefício') || c.includes('beneficio')) return 'previdenciario'
  if (c.includes('famil') || c.includes('aliment') || c.includes('divórcio') || c.includes('divorcio')) return 'familia'
  return 'civel'
}

export interface ImportResult {
  criados: number
  ignorados: number
  erros: number
  erroMensagem?: string
}

export async function importarProcessosSelecionados(
  processos: ScraperProcesso[],
  orgId: string,
): Promise<ImportResult> {
  if (processos.length === 0) return { criados: 0, ignorados: 0, erros: 0 }

  // 1. Busca números já existentes em casos
  const { data: existentes } = await supabase
    .from('casos')
    .select('numero_processo')
    .eq('org_id', orgId)
    .not('numero_processo', 'is', null)

  const existentesSet = new Set(
    (existentes ?? []).map(r => (r.numero_processo as string).replace(/\D/g, ''))
  )

  // 2. Separa novos dos já existentes
  const novos = processos.filter(
    p => !existentesSet.has(p.numero_processo.replace(/\D/g, ''))
  )
  const ignorados = processos.length - novos.length

  if (novos.length === 0) return { criados: 0, ignorados, erros: 0 }

  // 3. Upsert em datajud_processos + recupera IDs para linkar nos casos
  const dpRows = novos.map(p => ({
    numero_processo: p.numero_processo,
    tribunal:        p.tribunal,
    grau:            p.grau ?? null,
    classe_processual: p.classe ?? null,
    assunto:         p.assunto ?? null,
    raw_response:    p as unknown as Record<string, unknown>,
    cached_at:       new Date().toISOString(),
    org_id:          orgId,
  }))

  const { data: dpData, error: dpError } = await supabase
    .from('datajud_processos')
    .upsert(dpRows, { onConflict: 'numero_processo' })
    .select('id, numero_processo')

  if (dpError) {
    // Log but don't abort — the caso can still be created without the datajud link
    console.warn('[pjeImport] upsert datajud_processos falhou (continuando sem link):', dpError.message)
  }

  // Mapa numero_processo (só dígitos) → UUID do datajud_processos
  const dpIdMap = new Map(
    (dpData ?? []).map(r => [r.numero_processo.replace(/\D/g, ''), r.id])
  )

  // 4. Insert em casos com datajud_processo_id vinculado
  // prioridade é numérico: 1=baixa, 2=media, 3=alta, 4=critica (ver casosService.ts)
  const casoRows = novos.map(p => ({
    titulo:             `${p.classe || 'Processo'} — ${p.numero_processo}`,
    area:               derivarArea(p.classe),
    status:             'triagem'  as const,
    prioridade:         2,           // media
    numero_processo:    p.numero_processo,
    tribunal:           p.tribunal,
    grau:               p.grau ?? null,
    classe_processual:  p.classe ?? null,
    assunto_principal:  p.assunto ?? null,
    datajud_processo_id: dpIdMap.get(p.numero_processo.replace(/\D/g, '')) ?? null,
    org_id:             orgId,
    descricao:          null,
    cliente_id:         null,
    lead_id:            null,
    valor_estimado:     null,
    encerrado_em:       null,
  }))

  const { error } = await supabase.from('casos').insert(casoRows)

  if (error) {
    console.error('[pjeImport] insert casos falhou:', error.message)
    return { criados: 0, ignorados, erros: novos.length, erroMensagem: error.message }
  }

  return { criados: novos.length, ignorados, erros: 0 }
}

// ── DataJud direct import ──────────────────────────────────────────────────────

export interface ImportarDataJudResult {
  criado: boolean
  ignorado: boolean
  clienteCriado: boolean
  erro?: string
  casoId?: string
  clienteId?: string | null
}

/**
 * Imports a single ProcessoDataJud into casos + creates the client (polo ativo).
 *
 * Design decisions:
 * - datajud_processos upsert is best-effort: if it fails (RLS / constraint), we
 *   still insert the caso (without the FK link) rather than aborting.
 * - datajud_sync_status is set to 'sincronizado' so the case is marked as
 *   coming from DataJud.
 * - The first polo ativo party is created as a cliente and linked to the caso.
 *   Duplicate clients (same documento + org) are skipped and the existing id is used.
 */
export async function importarProcessoDataJud(
  processo: ProcessoDataJud,
  orgId: string,
): Promise<ImportarDataJudResult> {
  const numero =
    processo.numeroProcesso ??
    (processo.dadosBasicos as any)?.numero ??
    ''

  if (!numero.trim()) {
    return { criado: false, ignorado: false, clienteCriado: false, erro: 'Número do processo não identificado' }
  }

  const numeroDig = numero.replace(/\D/g, '')

  // 1. Verifica duplicata em casos
  const { data: existentes } = await supabase
    .from('casos')
    .select('id, numero_processo')
    .eq('org_id', orgId)
    .not('numero_processo', 'is', null)

  const existentesSet = new Set(
    (existentes ?? []).map((r) => (r.numero_processo as string).replace(/\D/g, ''))
  )

  if (existentesSet.has(numeroDig)) {
    return { criado: false, ignorado: true, clienteCriado: false }
  }

  // 2. Extrai classe e assunto
  const classeStr: string =
    (processo.classe as any)?.nome ??
    (processo.dadosBasicos as any)?.classeProcessual?.nome ??
    (typeof processo.classe === 'string' ? processo.classe : '') ??
    ''

  const assuntosArr: string[] = Array.isArray((processo.dadosBasicos as any)?.assunto)
    ? (processo.dadosBasicos as any).assunto.map((a: any) => a.nome || String(a)).filter(Boolean)
    : [processo.assunto].filter(Boolean) as string[]
  const assuntoStr = assuntosArr[0] ?? ''

  // 3. Tenta criar/atualizar datajud_processos (best-effort)
  let datajudProcessoId: string | null = null
  const { data: dpData, error: dpError } = await supabase
    .from('datajud_processos')
    .upsert(
      {
        numero_processo:   numero,
        tribunal:          processo.tribunal ?? '',
        grau:              processo.grau ?? null,
        classe_processual: classeStr || null,
        assunto:           assuntoStr || null,
        raw_response:      processo as unknown as Record<string, unknown>,
        cached_at:         new Date().toISOString(),
        org_id:            orgId,
      },
      { onConflict: 'numero_processo' },
    )
    .select('id')
  if (dpError) {
    console.warn('[importarProcessoDataJud] datajud_processos upsert falhou (continuando sem link):', dpError.message, dpError.code)
  } else {
    datajudProcessoId = dpData?.[0]?.id ?? null
  }

  // 4. Cria cliente a partir do polo ativo (se disponível)
  let clienteId: string | null = null
  let clienteCriado = false
  const polos: any[] = (processo.dadosBasicos as any)?.polo ?? []
  const poloAtivo = polos.find((p: any) =>
    p.polo === 'AT' ||
    String(p.polo ?? '').toLowerCase().includes('ativo') ||
    String(p.polo ?? '').toLowerCase().includes('autor') ||
    String(p.polo ?? '').toLowerCase().includes('requerente'),
  )

  if (poloAtivo?.nome) {
    const tipoPessoa =
      String(poloAtivo.tipoPessoa ?? '').toLowerCase() === 'juridica' ? 'pj' : 'pf'
    const documento: string | null = poloAtivo.documento ?? null

    // Verifica se cliente já existe pelo documento
    if (documento) {
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('org_id', orgId)
        .eq('documento', documento)
        .maybeSingle()
      if (clienteExistente) {
        clienteId = clienteExistente.id
      }
    }

    if (!clienteId) {
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nome:      poloAtivo.nome,
          tipo:      tipoPessoa,
          documento: documento,
          org_id:    orgId,
          tags:      ['status:ativo', 'health:ok', `area:${derivarArea(classeStr)}`],
        })
        .select('id')
      if (clienteError) {
        console.warn('[importarProcessoDataJud] clientes insert falhou (continuando sem cliente):', clienteError.message, clienteError.code)
      } else {
        clienteId = novoCliente?.[0]?.id ?? null
        if (clienteId) clienteCriado = true
      }
    }
  }

  // 5. Insere o caso
  const { error: casoError } = await supabase
    .from('casos')
    .insert({
      titulo:              `${classeStr || 'Processo'} — ${numero}`,
      area:                derivarArea(classeStr),
      status:              'triagem',
      prioridade:          2,           // media
      numero_processo:     numero,
      tribunal:            processo.tribunal ?? null,
      grau:                processo.grau ?? null,
      classe_processual:   classeStr || null,
      assunto_principal:   assuntoStr || null,
      datajud_processo_id: datajudProcessoId,
      datajud_sync_status: 'sincronizado',
      cliente_id:          clienteId,
      org_id:              orgId,
    })

  if (casoError) {
    console.error('[importarProcessoDataJud] insert casos falhou:', casoError.message, casoError.code, casoError.details, casoError.hint)
    return { criado: false, ignorado: false, clienteCriado, erro: casoError.message || 'Erro ao inserir caso' }
  }

  // Busca o ID do caso recém-inserido para retornar
  const { data: casoInserido } = await supabase
    .from('casos')
    .select('id')
    .eq('org_id', orgId)
    .eq('numero_processo', numero)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    criado:        true,
    ignorado:      false,
    clienteCriado,
    casoId:        casoInserido?.id ?? undefined,
    clienteId,
  }
}
