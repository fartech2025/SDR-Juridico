import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'

interface TeamsMeetingData {
  id: string
  subject: string
  joinWebUrl: string
  joinMeetingIdSettings?: {
    joinMeetingId: string
  }
  startDateTime: string
  endDateTime: string
  organizerEmail: string
}

interface CreateTeamsMeetingParams {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  attendees?: string[]
}

interface UseTeamsMeetingCreate {
  isLoading: boolean
  error: Error | null
  lastCreated: TeamsMeetingData | null
  createMeeting: (params: CreateTeamsMeetingParams) => Promise<TeamsMeetingData>
  createMeetingAndSync: (params: CreateTeamsMeetingParams & { 
    agendaData: any 
  }) => Promise<{ meeting: TeamsMeetingData; agendaItem: any }>
  isConnected: () => Promise<boolean>
}

export function useTeamsMeetingCreate(): UseTeamsMeetingCreate {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastCreated, setLastCreated] = useState<TeamsMeetingData | null>(null)

  /**
   * Verifica se Teams está conectado na organização
   */
  const isConnected = useCallback(async (): Promise<boolean> => {
    try {
      const orgId = await getActiveOrgId()
      if (!orgId) return false

      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('org_id', orgId)
        .eq('provider', 'teams')
        .maybeSingle()

      return !!integration
    } catch {
      return false
    }
  }, [])

  /**
   * Cria uma reunião no Microsoft Teams
   */
  const createMeeting = useCallback(
    async (params: CreateTeamsMeetingParams): Promise<TeamsMeetingData> => {
      try {
        setIsLoading(true)
        setError(null)

        const orgId = await getActiveOrgId()
        if (!orgId) {
          throw new Error('Organização não encontrada.')
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          throw new Error('Sessão expirada. Faça login novamente.')
        }

        // Chamar edge function para criar reunião no Teams
        const { data, error: createError } = await supabase.functions.invoke(
          'teams-create-event',
          {
            body: {
              org_id: orgId,
              title: params.title,
              description: params.description,
              startTime: params.startTime.toISOString(),
              endTime: params.endTime.toISOString(),
              attendees: params.attendees || [],
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        )

        if (createError) {
          throw new Error(createError.message || 'Erro ao criar reunião no Teams')
        }

        if (!data?.meeting) {
          throw new Error('Resposta inválida do Teams')
        }

        const meeting = data.meeting as TeamsMeetingData
        setLastCreated(meeting)
        return meeting
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao criar reunião')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Cria uma reunião no Teams e sincroniza com agenda local
   */
  const createMeetingAndSync = useCallback(
    async (
      params: CreateTeamsMeetingParams & { agendaData: any }
    ): Promise<{ meeting: TeamsMeetingData; agendaItem: any }> => {
      try {
        setIsLoading(true)
        setError(null)

        // Criar reunião no Teams
        const meeting = await createMeeting({
          title: params.title,
          description: params.description,
          startTime: params.startTime,
          endTime: params.endTime,
          attendees: params.attendees,
        })

        const orgId = await getActiveOrgId()
        if (!orgId) {
          throw new Error('Organização não encontrada.')
        }

        // Salvar na agenda local com o link do Teams
        const { data: agendaItem, error: syncError } = await supabase
          .from('agenda')
          .insert({
            org_id: orgId,
            titulo: params.title,
            descricao: params.description,
            data_inicio: params.startTime.toISOString(),
            data_fim: params.endTime.toISOString(),
            local: meeting.joinWebUrl, // Link do Teams no campo local
            tipo: 'reuniao_teams',
            external_provider: 'teams',
            external_event_id: meeting.id,
            ...params.agendaData,
          })
          .select()
          .single()

        if (syncError) {
          throw new Error('Erro ao sincronizar com agenda local')
        }

        return { meeting, agendaItem }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao sincronizar')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [createMeeting]
  )

  return {
    isLoading,
    error,
    lastCreated,
    createMeeting,
    createMeetingAndSync,
    isConnected,
  }
}
