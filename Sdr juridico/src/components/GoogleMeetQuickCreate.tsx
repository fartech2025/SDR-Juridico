import { useState } from 'react'
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'
import { Copy, Check, Video } from 'lucide-react'

interface GoogleMeetQuickCreateProps {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

export function GoogleMeetQuickCreate({ onSuccess, onError }: GoogleMeetQuickCreateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30) // minutos
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)

  const { createMeeting, isLoading, error } = useGoogleCalendarCreate()

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + duration * 60 * 1000)

      const result = await createMeeting({
        title: title.trim(),
        startTime: now,
        endTime: endTime,
        videoConference: true, // Sempre criar Google Meet
      })

      // Extrair link do Google Meet
      const meetLink =
        result.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || ''

      setMeetingUrl(meetLink)
      onSuccess?.(result)

      // Auto copiar link
      if (meetLink) {
        navigator.clipboard.writeText(meetLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar reunião')
      onError?.(error)
    }
  }

  const copyToClipboard = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div>
      {/* Botão para abrir modal */}
      {!isOpen && !meetingUrl && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Video size={18} />
          <span>+ Google Meet</span>
        </button>
      )}

      {/* Modal de criação rápida */}
      {isOpen && !meetingUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Video size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Criar Reunião Google Meet</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Reunião
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                <p className="font-medium">ℹ️ Link gerado automaticamente</p>
                <p className="text-xs mt-1">Você receberá um link único para compartilhar com participantes</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={!title.trim() || isLoading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {isLoading ? 'Criando...' : 'Criar Google Meet'}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setTitle('')
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Cancelar
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exibição do link gerado */}
      {meetingUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800 flex items-center gap-2">
              <span>✓</span>
              <span>Google Meet criado!</span>
            </p>
            <button
              onClick={() => {
                setMeetingUrl(null)
                setTitle('')
              }}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ✕
            </button>
          </div>

          <div className="bg-white rounded border border-green-200 p-3">
            <p className="text-xs text-gray-600 mb-2">Link da reunião:</p>
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm break-all font-medium"
            >
              {meetingUrl}
            </a>
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium transition"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Copiar Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              window.open(meetingUrl, '_blank')
            }}
            className="w-full flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition"
          >
            <Video size={18} />
            <span>Abrir Reunião</span>
          </button>
        </div>
      )}
    </div>
  )
}
