import { supabase } from '@/lib/supabaseClient'
import type { ScraperProcesso } from '@/types/caseIntelligence'

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

  // 3. Upsert em datajud_processos
  const dpRows = novos.map(p => ({
    numero_processo: p.numero_processo,
    tribunal: p.tribunal,
    grau: p.grau ?? null,
    classe_processual: p.classe ?? null,
    assunto: p.assunto ?? null,
    raw_response: p as unknown as Record<string, unknown>,
    cached_at: new Date().toISOString(),
    org_id: orgId,
  }))

  await supabase
    .from('datajud_processos')
    .upsert(dpRows, { onConflict: 'numero_processo' })

  // 4. Insert em casos (bulk)
  const casoRows = novos.map(p => ({
    titulo: `${p.classe || 'Processo'} — ${p.numero_processo}`,
    area: derivarArea(p.classe),
    status: 'triagem' as const,
    prioridade: 'media' as const,
    numero_processo: p.numero_processo,
    tribunal: p.tribunal,
    grau: p.grau ?? null,
    classe_processual: p.classe ?? null,
    assunto_principal: p.assunto ?? null,
    org_id: orgId,
    descricao: null,
    cliente_id: null,
    lead_id: null,
    valor_estimado: null,
    encerrado_em: null,
  }))

  const { error } = await supabase.from('casos').insert(casoRows)

  if (error) {
    return { criados: 0, ignorados, erros: novos.length }
  }

  return { criados: novos.length, ignorados, erros: 0 }
}
