import { useState } from 'react'
import { useTeamsMeetingCreate } from '@/hooks/useTeamsMeetingCreate'
import { useGoogleCalendarCreate } from '@/hooks/useGoogleCalendarCreate'

interface MeetingCreatorFormProps {
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  defaultValues?: {
    title?: string
    description?: string
    startTime?: Date
    endTime?: Date
  }
  agendaData?: any
}

export function MeetingCreatorForm({
  onSuccess,
  onError,
  defaultValues,
  agendaData,
}: MeetingCreatorFormProps) {
  const [formData, setFormData] = useState({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    startTime: defaultValues?.startTime || new Date(),
    endTime: defaultValues?.endTime || new Date(Date.now() + 60 * 60 * 1000),
    guests: '',
    useTeams: true,
    useGoogle: false,
  })

  const teams = useTeamsMeetingCreate()
  const google = useGoogleCalendarCreate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const attendees = formData.guests
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email)

    try {
      const results = []

      // Criar no Teams
      if (formData.useTeams) {
        const teamsResult = await teams.createMeetingAndSync({
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          attendees,
          agendaData: agendaData || {},
        })
        results.push({ provider: 'teams', ...teamsResult })
      }

      // Criar no Google Calendar
      if (formData.useGoogle) {
        const googleResult = await google.createMeetingAndSync(
          {
            title: formData.title,
            description: formData.description,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            guests: attendees,
            videoConference: true,
          },
          agendaData
        )
        results.push({ provider: 'google', ...googleResult })
      }

      if (results.length === 0) {
        throw new Error('Selecione pelo menos um provedor de reunião')
      }

      onSuccess?.(results)

      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        guests: '',
        useTeams: true,
        useGoogle: false,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      onError?.(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          rows={3}
          placeholder="Digite a descrição da reunião"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.useTeams}
            onChange={(e) => setFormData({ ...formData, useTeams: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Criar reunião no Microsoft Teams
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.useGoogle}
            onChange={(e) => setFormData({ ...formData, useGoogle: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Criar reunião no Google Calendar
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={teams.isLoading || google.isLoading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {teams.isLoading || google.isLoading ? 'Criando...' : 'Criar Reunião'}
        </button>
      </div>

      {(teams.error || google.error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {teams.error?.message || google.error?.message}
        </div>
      )}
    </form>
  )
}
