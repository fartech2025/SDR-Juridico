import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useAuth } from '@/contexts/AuthContext'
import { FunctionsHttpError } from '@supabase/supabase-js'

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
 * Converte GoogleMeetingInput para o formato da API Google Calendar
 */
function buildGoogleEventPayload(meeting: GoogleMeetingInput): Record<string, unknown> {
  const event: Record<string, unknown> = {
    summary: meeting.title,
    start: {
      dateTime: meeting.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: meeting.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  }

  if (meeting.description) event.description = meeting.description
  if (meeting.location) event.location = meeting.location

  if (meeting.guests?.length) {
    event.attendees = meeting.guests.map((email) => ({ email }))
  }

  if (meeting.videoConference) {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  if (meeting.reminders) {
    event.reminders = meeting.reminders
  }

  return event
}

/**
 * Hook para criar e gerenciar meetings no Google Calendar
 * Conecta ao edge function `google-calendar-create-event`
 */
export function useGoogleCalendarCreate() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastCreated, setLastCreated] = useState<CreatedGoogleMeeting | null>(null)
  const { currentOrg } = useOrganization()
  const { user } = useAuth()

  /**
   * Verifica se Google Calendar está conectado
   * Checa: 1) token pessoal do user (user_metadata) 2) integração da org
   */
  const isConnected = useCallback(async (): Promise<boolean> => {
    // Checar se user tem tokens Google no metadata (logou com Google)
    const userTokens = user?.user_metadata?.google_calendar_tokens
    if (userTokens?.access_token) return true

    // Checar se a org tem integração
    if (!currentOrg?.id) return false
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id')
        .eq('org_id', currentOrg.id)
        .eq('provider', 'google_calendar')
        .maybeSingle()
      return !error && !!data
    } catch {
      return false
    }
  }, [currentOrg?.id, user])

  /**
   * Cria um evento no Google Calendar via edge function
   */
  const createMeeting = useCallback(
    async (meeting: GoogleMeetingInput): Promise<CreatedGoogleMeeting> => {
      setIsLoading(true)
      setError(null)

      try {
        const eventPayload = buildGoogleEventPayload(meeting)
        
        // NÃO enviar token do localStorage (provider_token do Supabase Auth)
        // pois pertence ao projeto GCP do Supabase e não tem Calendar API ativada.
        // A Edge Function busca o token correto via user_metadata ou integração da org.

        // Verificar se há algum token disponível antes de chamar a edge function
        const hasUserMetadataTokens = !!user?.user_metadata?.google_calendar_tokens?.access_token
        if (!hasUserMetadataTokens && !currentOrg?.id) {
          throw new Error('Google Calendar não conectado. Vincule sua conta Google em Configurações → Integrações.')
        }

        console.log('📅 Google Calendar - Enviando:', {
          user_id: user?.id || null,
          org_id: currentOrg?.id || null,
          hasUserMetadataTokens,
          event: eventPayload,
        })

        const { data, error: fnError } = await supabase.functions.invoke(
          'google-calendar-create-event',
          {
            body: {
              user_id: user?.id || null,
              org_id: currentOrg?.id || null,
              event: eventPayload,
            },
          },
        )

        console.log('📅 Google Calendar - Resposta:', { data, fnError })

        if (fnError) {
          // Extrair o erro real da edge function (não a mensagem genérica do Supabase client)
          let realError = fnError.message
          if (fnError instanceof FunctionsHttpError) {
            try {
              const errBody = await fnError.context.json()
              console.error('📅 Google Calendar - Erro detalhado:', errBody)
              realError = errBody?.error || errBody?.message || realError
            } catch {
              // se não conseguir parsear, usa a mensagem genérica
            }
          }
          throw new Error(realError)
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Erro ao criar evento no Google Calendar')
        }

        const createdEvent = data.event as CreatedGoogleMeeting
        setLastCreated(createdEvent)
        return createdEvent
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [currentOrg?.id, user?.id],
  )

  /**
   * Cria um meeting e sincroniza com a agenda local
   */
  const createMeetingAndSync = useCallback(
    async (
      meeting: GoogleMeetingInput,
      _agendaData?: {
        tipo: string
        cliente_id?: string
        caso_id?: string
        responsavel_id?: string
      },
    ): Promise<{ googleEvent: CreatedGoogleMeeting; agendaId?: string }> => {
      const googleEvent = await createMeeting(meeting)
      setLastCreated(googleEvent)
      return { googleEvent }
    },
    [createMeeting],
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
