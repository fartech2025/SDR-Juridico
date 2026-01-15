import { useCallback, useState } from 'react'
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
      return false
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
        void meeting
        setIsLoading(true)
        setError(null)
        throw new Error('Integração Google Calendar não disponível no schema atual.')
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
        void agendaData
        const googleEvent = await createMeeting(meeting)
        setLastCreated(googleEvent)
        return { googleEvent }
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
