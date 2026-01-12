import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getActiveOrgId } from '@/lib/org'

/**
 * Interface para dados do meeting
 */
export interface GoogleMeetingInput {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  guests?: string[] // emails dos convidados
  videoConference?: boolean // Criar Google Meet automaticamente
  location?: string
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

/**
 * Interface para resultado do meeting criado
 */
export interface CreatedGoogleMeeting {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  htmlLink: string
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: string
      uri: string
      label?: string
    }>
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: string
  }>
}

/**
 * Hook para criar e gerenciar meetings no Google Calendar
 */
export function useGoogleCalendarCreate() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastCreated, setLastCreated] = useState<CreatedGoogleMeeting | null>(null)

  /**
   * Verifica se Google Calendar está conectado
   */
  const isConnected = useCallback(async (): Promise<boolean> => {
    try {
      const orgId = getActiveOrgId()
      if (!orgId) return false

      const { data, error: err } = await supabase
        .from('integrations')
        .select('enabled, secrets')
        .eq('org_id', orgId)
        .eq('provider', 'google_calendar')
        .maybeSingle()

      if (err || !data) return false

      const secrets = data.secrets || {}
      return Boolean(secrets.access_token) && data.enabled
    } catch {
      return false
    }
  }, [])

  /**
   * Cria um meeting no Google Calendar
   */
  const createMeeting = useCallback(
    async (meeting: GoogleMeetingInput): Promise<CreatedGoogleMeeting> => {
      try {
        setIsLoading(true)
        setError(null)

        const orgId = await getActiveOrgId()
        if (!orgId) throw new Error('Organização não encontrada')

        // Verificar conexão
        const connected = await isConnected()
        if (!connected) {
          throw new Error('Google Calendar não está conectado. Por favor, configure a integração nas configurações.')
        }

        // Chamar Edge Function para criar o evento
        const { data, error: err } = await supabase.functions.invoke(
          'google-calendar-create-event',
          {
            body: {
              org_id: orgId,
              event: {
                summary: meeting.title,
                description: meeting.description || '',
                location: meeting.location || '',
                start: {
                  dateTime: meeting.startTime.toISOString(),
                  timeZone: 'America/Sao_Paulo',
                },
                end: {
                  dateTime: meeting.endTime.toISOString(),
                  timeZone: 'America/Sao_Paulo',
                },
                attendees: meeting.guests?.map((email) => ({ email })) || [],
                reminders: meeting.reminders || {
                  useDefault: true,
                },
                conferenceData: meeting.videoConference
                  ? {
                      createRequest: {
                        requestId: `meet-${Date.now()}`,
                        conferenceSolutionKey: {
                          key: 'hangoutsMeet',
                        },
                      },
                    }
                  : undefined,
              },
            },
          }
        )

        if (err) {
          throw new Error(
            err instanceof Error ? err.message : 'Erro ao criar meeting no Google Calendar'
          )
        }

        const createdMeeting = data as CreatedGoogleMeeting
        setLastCreated(createdMeeting)

        return createdMeeting
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected]
  )

  /**
   * Cria um meeting e sincroniza com a agenda local
   */
  const createMeetingAndSync = useCallback(
    async (
      meeting: GoogleMeetingInput,
      agendaData?: {
        tipo: string
        cliente_id?: string
        caso_id?: string
        responsavel_id?: string
      }
    ): Promise<{ googleEvent: CreatedGoogleMeeting; agendaId?: string }> => {
      try {
        // Criar no Google Calendar
        const googleEvent = await createMeeting(meeting)

        // Sincronizar com agenda local
        if (agendaData) {
          const { data: agenda, error: agendaErr } = await supabase
            .from('agendamentos')
            .insert({
              org_id: getActiveOrgId(),
              titulo: meeting.title,
              descricao: meeting.description,
              tipo: agendaData.tipo,
              data_inicio: meeting.startTime.toISOString(),
              data_fim: meeting.endTime.toISOString(),
              local: meeting.location,
              cliente_id: agendaData.cliente_id,
              caso_id: agendaData.caso_id,
              responsavel_id: agendaData.responsavel_id,
              external_provider: 'google_calendar',
              external_id: googleEvent.id,
              url_reuniao: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
            })
            .select('id')
            .single()

          if (agendaErr) {
            console.error('Erro ao sincronizar com agenda:', agendaErr)
          }

          return {
            googleEvent,
            agendaId: agenda?.id,
          }
        }

        return {
          googleEvent,
        }
      } catch (err) {
        throw err
      }
    },
    [createMeeting]
  )

  return {
    createMeeting,
    createMeetingAndSync,
    isLoading,
    error,
    lastCreated,
    isConnected,
  }
}
