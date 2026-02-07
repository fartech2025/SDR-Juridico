import { useCallback, useState } from 'react'
import { datajudTimelineService } from '@/services/datajudTimelineService'
import type { CasoProcessoInfo } from '@/services/datajudTimelineService'
import type { TimelineEvent } from '@/types/domain'
import type { DatajudMovimentacaoRow, DatajudProcessoRow } from '@/lib/supabaseClient'

interface UseDatajudTimelineState {
  eventos: TimelineEvent[]
  loading: boolean
  error: Error | null
}

const toIsoDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const buildProcessTitle = (processo: DatajudProcessoRow) => {
  return `Processo ${processo.numero_processo || processo.id}`
}

const buildProcessDescription = (processo: DatajudProcessoRow) => {
  const parts: string[] = []
  if (processo.tribunal) parts.push(`Tribunal: ${processo.tribunal}`)
  if (processo.classe_processual) parts.push(`Classe: ${processo.classe_processual}`)
  if (processo.grau) parts.push(`Grau: ${processo.grau}`)
  return parts.join(' | ') || 'Processo importado do DataJud.'
}

const buildMovimentacaoTitle = (mov: DatajudMovimentacaoRow) => {
  const base = mov.nome?.trim()
  if (base) return base
  if (mov.codigo) return `Movimentacao ${mov.codigo}`
  return 'Movimentacao registrada'
}

const buildMovimentacaoDescription = (processo?: DatajudProcessoRow) => {
  if (!processo) return 'Movimentacao do DataJud.'
  return `Processo ${processo.numero_processo || processo.id}`
}

/**
 * Gera evento sintetico a partir dos campos do proprio caso
 * quando nao ha registro na tabela datajud_processos
 */
const buildSyntheticEvent = (casoId: string, info: CasoProcessoInfo): TimelineEvent => {
  const parts: string[] = []
  if (info.tribunal) parts.push(`Tribunal: ${info.tribunal}`)
  if (info.classe_processual) parts.push(`Classe: ${info.classe_processual}`)
  if (info.grau) parts.push(`Grau: ${info.grau}`)
  if (info.assunto_principal) parts.push(`Assunto: ${info.assunto_principal}`)

  return {
    id: `datajud-caso-${casoId}`,
    casoId,
    title: `Processo ${info.numero_processo}`,
    category: 'juridico',
    channel: 'DataJud',
    date: toIsoDate(info.datajud_last_sync_at) || new Date().toISOString(),
    description: parts.join(' | ') || 'Processo vinculado via DataJud.',
    tags: ['datajud', 'processo'],
    author: 'Sistema',
  }
}

export function useDatajudTimeline() {
  const [state, setState] = useState<UseDatajudTimelineState>({
    eventos: [],
    loading: false,
    error: null,
  })

  const fetchByCaso = useCallback(async (casoId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const { processos, casoInfo } = await datajudTimelineService.getProcessosByCaso(casoId)
      const processoMap = new Map(processos.map((processo) => [processo.id, processo]))
      const movimentacoes = await datajudTimelineService.getMovimentacoesByProcessos(
        Array.from(processoMap.keys()),
      )

      const processoEvents: TimelineEvent[] = processos.map((processo) => ({
        id: `datajud-processo-${processo.id}`,
        casoId: casoId,
        title: buildProcessTitle(processo),
        category: 'juridico',
        channel: 'DataJud',
        date: toIsoDate(processo.cached_at || processo.created_at) || new Date().toISOString(),
        description: buildProcessDescription(processo),
        tags: ['datajud', 'processo'],
        author: 'Sistema',
      }))

      const movimentacaoEvents: TimelineEvent[] = movimentacoes.map((movimentacao) => {
        const processo = processoMap.get(movimentacao.datajud_processo_id)
        return {
          id: `datajud-mov-${movimentacao.id}`,
          casoId: casoId,
          title: buildMovimentacaoTitle(movimentacao),
          category: 'juridico',
          channel: 'DataJud',
          date:
            toIsoDate(movimentacao.data_hora || movimentacao.created_at) ||
            new Date().toISOString(),
          description: buildMovimentacaoDescription(processo),
          tags: ['datajud', 'movimentacao'],
          author: 'Sistema',
        }
      })

      let eventos = [...processoEvents, ...movimentacaoEvents]

      // Fallback: se nao encontrou processos no banco mas o caso tem numero_processo,
      // gera um evento sintetico para que a timeline mostre o vinculo
      if (eventos.length === 0 && casoInfo?.numero_processo) {
        eventos = [buildSyntheticEvent(casoId, casoInfo)]
      }

      setState((prev) => ({ ...prev, eventos, loading: false }))
      return eventos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  return {
    ...state,
    fetchByCaso,
  }
}
