import { useState } from 'react'
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'

interface GoogleMeetingQuickCreateProps {
  clienteId?: string
  casoId?: string
  responsavelId?: string
  onSuccess?: (meetUrl?: string) => void
}

/**
 * Componente rápido para criar Google Meet
 */
export function GoogleMeetingQuickCreate({
  clienteId,
  casoId,
  responsavelId,
  onSuccess,
}: GoogleMeetingQuickCreateProps) {
  const { createMeetingAndSync, isLoading, error } = useGoogleCalendarCreate()
  const [showDialog, setShowDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60) // minutos

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + duration * 60 * 1000)

      const result = await createMeetingAndSync(
        {
          title: title.trim(),
          startTime: now,
          endTime,
          videoConference: true,
        },
        {
          tipo: 'reuniao',
          cliente_id: clienteId,
          caso_id: casoId,
          responsavel_id: responsavelId,
        }
      )

      const meetUrl = result.googleEvent.conferenceData?.entryPoints?.[0]?.uri

      // Copiar URL para clipboard se disponível
      if (meetUrl) {
        navigator.clipboard.writeText(meetUrl)
      }

      onSuccess?.(meetUrl)
      setShowDialog(false)
      setTitle('')
      setDuration(60)
    } catch (err) {
      console.error('Erro ao criar reunião:', err)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-success text-text-inverse rounded-md hover:bg-success-dark text-sm font-medium"
        title="Criar Google Meet agora"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Google Meet
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-bold mb-4">Criar Google Meet Agora</h2>

            {error && (
              <div className="p-3 bg-danger-bg border border-danger-border rounded text-danger text-sm mb-4">
                {error.message}
              </div>
            )}

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Reunião *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião rápida"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              {/* Duração */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-success text-text-inverse rounded-md hover:bg-success-dark disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GoogleMeetingQuickCreate
