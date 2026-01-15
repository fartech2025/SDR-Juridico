import { supabase } from '@/lib/supabaseClient'
import type { AgendaRow } from '@/lib/supabaseClient'
import { AppError } from '@/utils/errors'

export const agendaService = {
  /**
   * Busca todos os eventos da agenda
   */
  async getEventos(): Promise<AgendaRow[]> {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('data_inicio', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca um evento específico
   */
  async getEvento(id: string): Promise<AgendaRow> {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
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
  async getEventosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendaRow[]> {
    try {
      const query = supabase
        .from('agenda')
        .select('*')
        .gte('data_inicio', dataInicio.toISOString())
        .lte('data_inicio', dataFim.toISOString())
      const { data, error } = await query.order('data_inicio', { ascending: true })

      if (error) throw new AppError(error.message, 'database_error')
      return data || []
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Busca eventos de hoje
   */
  async getEventosHoje(): Promise<AgendaRow[]> {
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
  async getEventosDaSemana(): Promise<AgendaRow[]> {
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
  async getEventosByTipo(tipo: string): Promise<AgendaRow[]> {
    try {
      const eventos = await this.getEventos()
      return eventos.filter((evento) => evento.tipo === tipo)
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar eventos', 'database_error')
    }
  },

  /**
   * Cria um novo evento
   */
  async createEvento(
    evento: Omit<AgendaRow, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AgendaRow> {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .insert([evento])
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
    updates: Partial<Omit<AgendaRow, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AgendaRow> {
    try {
      const { data, error } = await supabase
        .from('agenda')
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
        .from('agenda')
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
  async getProximosEventos(dias: number = 7): Promise<AgendaRow[]> {
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
  async getEventosPassados(dias: number = 7): Promise<AgendaRow[]> {
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
        reunioes: eventos.filter((e) => e.tipo === 'reuniao').length,
        ligacoes: eventos.filter((e) => e.tipo === 'ligacao').length,
        visitas: eventos.filter((e) => e.tipo === 'visita').length,
        proximos_7_dias: proximos.length,
      }
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('Erro ao buscar estatísticas', 'database_error')
    }
  },
}
