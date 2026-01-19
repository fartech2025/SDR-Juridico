import React, { useState } from 'react'
import { useGoogleCalendarCreate, type GoogleMeetingInput } from '@/hooks/useGoogleCalendarCreate'

interface GoogleMeetingFormProps {
  onSuccess?: (result: { googleEventId: string; agendaId?: string; meetUrl?: string }) => void
  onError?: (error: Error) => void
  initialData?: Partial<GoogleMeetingInput>
  clienteId?: string
  casoId?: string
  responsavelId?: string
}

/**
 * Componente para criar meetings no Google Calendar
 */
export function GoogleMeetingForm({
  onSuccess,
  onError,
  initialData,
  clienteId,
  casoId,
  responsavelId,
}: GoogleMeetingFormProps) {
  const { createMeetingAndSync, isLoading, error } = useGoogleCalendarCreate()

  const [formData, setFormData] = useState<GoogleMeetingInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startTime: initialData?.startTime || new Date(),
    endTime: initialData?.endTime || new Date(Date.now() + 60 * 60 * 1000),
    guests: initialData?.guests || [],
    videoConference: initialData?.videoConference ?? true,
    location: initialData?.location || '',
  })

  const [guestEmail, setGuestEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddGuest = () => {
    if (guestEmail && guestEmail.includes('@')) {
      setFormData((prev) => ({
        ...prev,
        guests: [...(prev.guests || []), guestEmail],
      }))
      setGuestEmail('')
    }
  }

  const handleRemoveGuest = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      guests: (prev.guests || []).filter((g) => g !== email),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createMeetingAndSync(formData, {
        tipo: 'reuniao',
        cliente_id: clienteId,
        caso_id: casoId,
        responsavel_id: responsavelId,
      })

      onSuccess?.({
        googleEventId: result.googleEvent.id,
        agendaId: result.agendaId,
        meetUrl: result.googleEvent.conferenceData?.entryPoints?.[0]?.uri,
      })

      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        guests: [],
        videoConference: true,
        location: '',
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      onError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-danger-bg border border-danger-border rounded text-danger text-sm">
          {error?.message}
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título da Reunião *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Reunião com cliente"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detalhes da reunião..."
          rows={3}
        />
      </div>

      {/* Local */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Local
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Escritório, Zoom, etc"
        />
      </div>

      {/* Data/Hora Início */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Início *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.startTime.toISOString().slice(0, 16)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                startTime: new Date(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Fim *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.endTime.toISOString().slice(0, 16)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                endTime: new Date(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Google Meet */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="videoConference"
          checked={formData.videoConference}
          onChange={(e) => setFormData((prev) => ({ ...prev, videoConference: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="videoConference" className="text-sm font-medium text-gray-700">
          Criar Google Meet automaticamente
        </label>
      </div>

      {/* Convidados */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Convidados
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuest())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
          />
          <button
            type="button"
            onClick={handleAddGuest}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Adicionar
          </button>
        </div>

        {/* Lista de convidados */}
        {formData.guests && formData.guests.length > 0 && (
          <div className="space-y-1">
            {formData.guests.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <span className="text-sm">{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGuest(email)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Enviar */}
      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isLoading || isSubmitting ? 'Criando reunião...' : 'Criar Reunião no Google Calendar'}
      </button>
    </form>
  )
}

export default GoogleMeetingForm
