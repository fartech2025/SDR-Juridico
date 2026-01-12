import { useState } from 'react'
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'
import { Copy, Check } from 'lucide-react'

interface GoogleMeetAgendaIntegrationProps {
  onMeetingCreated?: (result: { meeting: any; meetLink: string }) => void
  onError?: (error: Error) => void
  defaultValues?: {
    title?: string
    description?: string
    startTime?: Date
    endTime?: Date
  }
}

export function GoogleMeetAgendaIntegration({
  onMeetingCreated,
  onError,
  defaultValues,
}: GoogleMeetAgendaIntegrationProps) {
  const [formData, setFormData] = useState({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    startTime: defaultValues?.startTime || new Date(),
    endTime: defaultValues?.endTime || new Date(Date.now() + 60 * 60 * 1000),
    guests: '',
  })

  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { createMeeting, isLoading, error } = useGoogleCalendarCreate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const guests = formData.guests
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email)

    try {
      const result = await createMeeting({
        title: formData.title,
        description: formData.description,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        guests,
        videoConference: true, // Sempre criar Google Meet
      })

      // Extrair link do Google Meet
      const meetLink =
        result.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || ''

      setMeetingUrl(meetLink)
      onMeetingCreated?.({ meeting: result, meetLink })

      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        guests: '',
      })
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

  if (meetingUrl) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-green-800">✓ Google Meet criado!</p>
          <button
            onClick={() => setMeetingUrl(null)}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="bg-white rounded border border-green-200 p-3 space-y-2">
          <p className="text-xs text-gray-600">Link para salvar no campo "Local":</p>
          <input
            type="text"
            readOnly
            value={meetingUrl}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium transition text-sm"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              window.open(meetingUrl, '_blank')
            }}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition text-sm"
          >
            <span>Abrir</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>📹</span>
        <span>Criar Google Meet</span>
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título da Reunião *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Digite o título da reunião"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Digite a descrição da reunião"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data/Hora Início *
          </label>
          <input
            type="datetime-local"
            required
            value={new Date(formData.startTime).toISOString().slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, startTime: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data/Hora Fim *
          </label>
          <input
            type="datetime-local"
            required
            value={new Date(formData.endTime).toISOString().slice(0, 16)}
            onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Participantes (emails separados por vírgula)
        </label>
        <input
          type="text"
          value={formData.guests}
          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="email1@example.com, email2@example.com"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
        <p className="font-medium">💡 Link automático</p>
        <p className="text-xs mt-1">
          Após criar, o link do Google Meet será exibido para copiar e salvar no campo "Local" da agenda
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
      >
        {isLoading ? 'Criando Google Meet...' : 'Criar Google Meet'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error.message}
        </div>
      )}
    </form>
  )
}
