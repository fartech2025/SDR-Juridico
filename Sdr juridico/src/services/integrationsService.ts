import { AppError } from '@/utils/errors'

const defaultIntegrations = [
  { provider: 'whatsapp', name: 'WhatsApp', enabled: false },
  { provider: 'google_calendar', name: 'Google Calendar', enabled: false },
  { provider: 'google_meet', name: 'Google Meet', enabled: false },
  { provider: 'teams', name: 'Microsoft Teams', enabled: false },
  { provider: 'datajud', name: 'DataJud', enabled: false },
  { provider: 'twilio', name: 'Twilio', enabled: false },
  { provider: 'evolution', name: 'Evolution', enabled: false },
  { provider: 'avisa', name: 'Avisa', enabled: false },
]

export interface IntegrationRow {
  id: string
  provider: string
  name: string | null
  enabled: boolean
  secrets: Record<string, unknown> | null
  settings: Record<string, unknown> | null
  created_at: string
}

const STORAGE_KEY = 'sdr_integrations'

const loadIntegrations = (): IntegrationRow[] => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveIntegrations = (rows: IntegrationRow[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

const seedDefaults = (): IntegrationRow[] => {
  const existing = loadIntegrations()
  if (existing.length > 0) return existing
  const now = new Date().toISOString()
  const seeded = defaultIntegrations.map((item) => ({
    id: `${item.provider}-${now}`,
    provider: item.provider,
    name: item.name,
    enabled: item.enabled,
    secrets: {},
    settings: {},
    created_at: now,
  }))
  saveIntegrations(seeded)
  return seeded
}

export const integrationsService = {
  async getIntegrations(): Promise<IntegrationRow[]> {
    try {
      return seedDefaults()
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao buscar integracoes',
        'database_error'
      )
    }
  },

  async cleanupDuplicates(): Promise<number> {
    const rows = seedDefaults()
    const idsToDelete: string[] = []
    const grouped = new Map<string, typeof rows>()

    rows.forEach((row) => {
      const key = row.provider
      const list = grouped.get(key) || []
      list.push(row)
      grouped.set(key, list)
    })

    grouped.forEach((list) => {
      if (list.length <= 1) return
      const connected = list.filter((row) => row.enabled)
      if (connected.length > 0) {
        list
          .filter((row) => !row.enabled)
          .forEach((row) => idsToDelete.push(row.id))
        return
      }
      const [, ...rest] = list
      rest.forEach((row) => idsToDelete.push(row.id))
    })

    if (idsToDelete.length === 0) return 0
    const filtered = rows.filter((row) => !idsToDelete.includes(row.id))
    saveIntegrations(filtered)
    return idsToDelete.length
  },

  async updateIntegration(
    id: string,
    updates: Partial<Pick<IntegrationRow, 'enabled' | 'settings' | 'secrets' | 'name'>>
  ): Promise<IntegrationRow> {
    try {
      const rows = seedDefaults()
      const idx = rows.findIndex((row) => row.id === id)
      if (idx === -1) throw new AppError('Integracao nao encontrada', 'not_found')
      const updated = { ...rows[idx], ...updates }
      const next = [...rows]
      next[idx] = updated
      saveIntegrations(next)
      return updated
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao atualizar integracao',
        'database_error'
      )
    }
  },

  async ensureDefaultIntegrations(): Promise<void> {
    try {
      seedDefaults()
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Erro ao criar integracoes padrao',
        'database_error'
      )
    }
  },
}
