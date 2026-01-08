import { supabase } from '@/lib/supabaseClient'
import type { AgendamentoRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const agendaService = {
  resolveMetaDefaults(evento: Omit<AgendamentoRow, 'id' | 'created_at'>) {
    const existingMeta =
      evento.meta && typeof evento.meta === 'object'
        ? (evento.meta as Record<string, unknown>)
        : {}
    const status = (existingMeta.status as string | undefined) || 'confirmado'
    const tipo = (existingMeta.tipo as string | undefined) || 'compromisso'
    return {
      ...existingMeta,
      status,
      tipo,
    }
  },
  /**
   * Busca todos os eventos da agenda
   */
  async getEventos(): Promise<AgendamentoRow[]> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, cliente:clientes(nome), caso:casos(titulo), lead:leads(nome), owner:profiles!owner_user_id(nome)')
        .order('start_at', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca um evento específico
   */
  async getEvento(id: string): Promise<AgendamentoRow> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, cliente:clientes(nome), caso:casos(titulo), lead:leads(nome), owner:profiles!owner_user_id(nome)')
        .eq('id', id)
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Evento não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar evento', 'database_error')
    }
  },

  /**
   * Busca eventos de um período específico
   */
  async getEventosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendamentoRow[]> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, cliente:clientes(nome), caso:casos(titulo), lead:leads(nome), owner:profiles!owner_user_id(nome)')
        .gte('start_at', dataInicio.toISOString())
        .lte('start_at', dataFim.toISOString())
        .order('start_at', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca eventos de hoje
   */
  async getEventosHoje(): Promise<AgendamentoRow[]> {
    try {
      const hoje = new Date()
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      return this.getEventosPorPeriodo(hoje, amanha)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos de hoje', 'database_error')
    }
  },

  /**
   * Busca eventos de um período (semana, mês)
   */
  async getEventosDaSemana(): Promise<AgendamentoRow[]> {
    try {
      const hoje = new Date()
      const proximoSabado = new Date(hoje)
      proximoSabado.setDate(proximoSabado.getDate() + (7 - hoje.getDay()))

      return this.getEventosPorPeriodo(hoje, proximoSabado)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos da semana', 'database_error')
    }
  },

  /**
   * Busca eventos por tipo
   */
  async getEventosByTipo(tipo: string): Promise<AgendamentoRow[]> {
    try {
      const eventos = await this.getEventos()
      return eventos.filter((evento) => {
        if (!evento.meta || typeof evento.meta !== 'object') return false
        return (evento.meta as { tipo?: string }).tipo === tipo
      })
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Cria um novo evento
   */
  async createEvento(
    evento: Omit<AgendamentoRow, 'id' | 'created_at'>
  ): Promise<AgendamentoRow> {
    try {
      const meta = this.resolveMetaDefaults(evento)
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([{ ...evento, meta }])
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Erro ao criar evento', 'database_error')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao criar evento', 'database_error')
    }
  },

  /**
   * Atualiza um evento existente
   */
  async updateEvento(
    id: string,
    updates: Partial<Omit<AgendamentoRow, 'id' | 'created_at' | 'org_id'>>
  ): Promise<AgendamentoRow> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new AppError(error.message, 'database_error')
      if (!data) throw new AppError('Evento não encontrado', 'not_found')

      return data
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao atualizar evento', 'database_error')
    }
  },

  /**
   * Deleta um evento
   */
  async deleteEvento(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)

      if (error) throw new AppError(error.message, 'database_error')
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao deletar evento', 'database_error')
    }
  },

  /**
   * Busca próximos eventos
   */
  async getProximosEventos(dias: number = 7): Promise<AgendamentoRow[]> {
    try {
      const hoje = new Date()
      const futuro = new Date(hoje)
      futuro.setDate(futuro.getDate() + dias)

      return this.getEventosPorPeriodo(hoje, futuro)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar próximos eventos', 'database_error')
    }
  },

  /**
   * Busca eventos passados
   */
  async getEventosPassados(dias: number = 7): Promise<AgendamentoRow[]> {
    try {
      const hoje = new Date()
      const passado = new Date(hoje)
      passado.setDate(passado.getDate() - dias)

      return this.getEventosPorPeriodo(passado, hoje)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos passados', 'database_error')
    }
  },

  /**
   * Busca estatísticas de agenda
   */
  async getEstatisticas(): Promise<{
    total: number
    reunioes: number
    ligacoes: number
    visitas: number
    proximos_7_dias: number
  }> {
    try {
      const [eventos, proximos] = await Promise.all([
        this.getEventos(),
        this.getProximosEventos(7),
      ])

      return {
        total: eventos.length,
        reunioes: eventos.filter((e) => (e as any).tipo === 'reuniao').length,
        ligacoes: eventos.filter((e) => (e as any).tipo === 'ligacao').length,
        visitas: eventos.filter((e) => (e as any).tipo === 'visita').length,
        proximos_7_dias: proximos.length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
