import { useState } from 'react'
import { useTeamsMeetingCreate } from '@/hooks/useTeamsMeetingCreate'
import { Copy, Check } from 'lucide-react'

interface TeamsQuickCreateProps {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

export function TeamsQuickCreate({ onSuccess, onError }: TeamsQuickCreateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30) // minutos
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)

  const teams = useTeamsMeetingCreate()

  const handleCreate = async () => {
    if (!title.trim()) return

    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + duration * 60 * 1000)

      const result = await teams.createMeeting({
        title: title.trim(),
        startTime: now,
        endTime: endTime,
      })

      setMeetingUrl(result.joinWebUrl)
      onSuccess?.(result)

      // Auto copiar link
      if (result.joinWebUrl) {
        navigator.clipboard.writeText(result.joinWebUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao criar reunião')
      onError?.(err)
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
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <span>+ Reunião Teams</span>
        </button>
      )}

      {/* Modal de criação rápida */}
      {isOpen && !meetingUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Reunião no Teams</h3>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={!title.trim() || teams.isLoading}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {teams.isLoading ? 'Criando...' : 'Criar'}
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

            {teams.error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {teams.error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exibição do link gerado */}
      {meetingUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800">✓ Reunião criada no Teams!</p>
            <button
              onClick={() => {
                setMeetingUrl(null)
                setTitle('')
              }}
              className="text-gray-500 hover:text-gray-700"
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
            className="w-full flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 rounded-lg font-medium transition"
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
        </div>
      )}
    </div>
  )
}
