import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

export const DEFAULT_PAST_DAYS = 90
export const DEFAULT_FUTURE_DAYS = 180

export type SyncResult = {
  orgId: string
  integrationId: string
  calendarId: string
  pulled: number
  updated: number
  created: number
  cancelled: number
  pushed: number
  deleted: number
  googleCount: number
  localCount: number
}

export type SyncLogger = (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void

const toIso = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const buildDateTime = (payload?: { dateTime?: string; date?: string }) => {
  if (!payload) return null
  if (payload.dateTime) return toIso(payload.dateTime)
  if (payload.date) return toIso(`${payload.date}T00:00:00`)
  return null
}

const fetchGoogle = async (
  url: string,
  accessToken: string,
  init?: RequestInit,
) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  return response
}

const shouldRefresh = (expiresAt?: string | null) => {
  if (!expiresAt) return true
  const expiresAtMs = new Date(expiresAt).getTime()
  if (Number.isNaN(expiresAtMs)) return true
  return expiresAtMs - Date.now() < 60_000
}

const refreshAccessToken = async (
  refreshToken: string,
  googleClientId: string,
  googleClientSecret: string,
) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao renovar token do Google Calendar')
  }

  const data = await response.json()
  return {
    accessToken: data.access_token as string,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    scope: data.scope as string | undefined,
    tokenType: data.token_type as string | undefined,
  }
}

export const createSupabaseAdminClient = (supabaseUrl: string, serviceKey: string) =>
  createClient(supabaseUrl, serviceKey)

export const syncGoogleCalendarForOrg = async (params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>
  orgId: string
  integration: {
    id: string
    org_id: string
    secrets: Record<string, unknown> | null
    settings: Record<string, unknown> | null
  }
  googleClientId: string
  googleClientSecret: string
  logger?: SyncLogger
}) => {
  const { supabase, orgId, integration, googleClientId, googleClientSecret, logger } = params
  const log = logger || (() => {})

  const secrets = integration.secrets || {}
  const settings = integration.settings || {}

  const refreshToken = secrets.refresh_token as string | undefined
  let accessToken = secrets.access_token as string | undefined
  let expiresAt = secrets.expires_at as string | undefined

  if (!accessToken || shouldRefresh(expiresAt)) {
    if (!refreshToken) {
      throw new Error('Missing refresh token')
    }
    log('info', 'Refreshing Google access token', { orgId })
    const refreshed = await refreshAccessToken(refreshToken, googleClientId, googleClientSecret)
    accessToken = refreshed.accessToken
    expiresAt = refreshed.expiresAt || undefined

    const nextSecrets = {
      ...secrets,
      access_token: accessToken,
      expires_at: expiresAt,
      scope: refreshed.scope || secrets.scope,
      token_type: refreshed.tokenType || secrets.token_type,
      updated_at: new Date().toISOString(),
    }

    await supabase
      .from('integrations')
      .update({ secrets: nextSecrets })
      .eq('id', integration.id)
  }

  if (!accessToken) {
    throw new Error('Missing access token')
  }

  const calendarId =
    typeof settings.calendar_id === 'string' && settings.calendar_id.trim()
      ? settings.calendar_id.trim()
      : 'primary'

  const rangeStart = new Date(Date.now() - DEFAULT_PAST_DAYS * 24 * 60 * 60 * 1000)
  const rangeEnd = new Date(Date.now() + DEFAULT_FUTURE_DAYS * 24 * 60 * 60 * 1000)

  const timeMin = rangeStart.toISOString()
  const timeMax = rangeEnd.toISOString()

  const googleEvents: any[] = []
  let pageToken = ''
  do {
    const listUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId,
      )}/events`,
    )
    listUrl.searchParams.set('singleEvents', 'true')
    listUrl.searchParams.set('orderBy', 'startTime')
    listUrl.searchParams.set('showDeleted', 'true')
    listUrl.searchParams.set('timeMin', timeMin)
    listUrl.searchParams.set('timeMax', timeMax)
    listUrl.searchParams.set('maxResults', '2500')
    if (pageToken) listUrl.searchParams.set('pageToken', pageToken)

    const response = await fetchGoogle(listUrl.toString(), accessToken)
    if (!response.ok) {
      throw new Error('Google list error')
    }
    const data = await response.json()
    googleEvents.push(...(data.items || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  const { data: localEvents, error: localError } = await supabase
    .from('agendamentos')
    .select('id, title, start_at, end_at, location, description, org_id, external_event_id, external_provider, meta, created_at')
    .eq('org_id', orgId)
    .gte('start_at', timeMin)
    .lte('start_at', timeMax)

  if (localError) {
    throw new Error('Local agenda query error')
  }

  const localRows = localEvents || []
  const localByGoogleId = new Map<string, any>()
  localRows.forEach((row) => {
    if (row.external_event_id) {
      localByGoogleId.set(row.external_event_id, row)
    }
  })

  log('info', 'Sync fetched events', {
    orgId,
    calendarId,
    googleCount: googleEvents.length,
    localCount: localRows.length,
  })

  let pulled = 0
  let updated = 0
  let created = 0
  let cancelled = 0

  for (const event of googleEvents) {
    const googleId = event.id as string | undefined
    if (!googleId) continue

    const status = event.status as string | undefined
    const isCancelled = status === 'cancelled'

    const existing = localByGoogleId.get(googleId)
    if (!existing && isCancelled) {
      continue
    }

    const startAt = buildDateTime(event.start)
    const endAt = buildDateTime(event.end)

    const existingMeta =
      existing?.meta && typeof existing.meta === 'object'
        ? (existing.meta as Record<string, unknown>)
        : {}

    const nextMeta = {
      ...existingMeta,
      google_updated: event.updated || null,
      google_status: status || null,
      google_link: event.htmlLink || null,
      google_meet: event.hangoutLink || null,
      google_organizer: event.organizer?.email || null,
      status: isCancelled ? 'cancelado' : existingMeta.status,
    }

    if (isCancelled) {
      if (existing) {
        await supabase
          .from('agendamentos')
          .update({ meta: nextMeta })
          .eq('id', existing.id)
        cancelled += 1
      }
      continue
    }

    if (existing) {
      const existingUpdated = existingMeta.google_updated
      if (
        existingUpdated &&
        event.updated &&
        new Date(event.updated).getTime() <= new Date(String(existingUpdated)).getTime()
      ) {
        continue
      }

      await supabase
        .from('agendamentos')
        .update({
          title: event.summary || existing.title || 'Evento Google',
          start_at: startAt || existing.start_at,
          end_at: endAt || existing.end_at,
          location: event.location || existing.location || null,
          description: event.description || existing.description || null,
          external_provider: 'google_calendar',
          external_event_id: googleId,
          meta: nextMeta,
        })
        .eq('id', existing.id)
      updated += 1
      continue
    }

    await supabase
      .from('agendamentos')
      .insert({
        org_id: orgId,
        title: event.summary || 'Evento Google',
        start_at: startAt || new Date().toISOString(),
        end_at: endAt || new Date().toISOString(),
        location: event.location || null,
        description: event.description || null,
        owner_user_id: null,
        lead_id: null,
        cliente_id: null,
        caso_id: null,
        external_provider: 'google_calendar',
        external_event_id: googleId,
        meta: nextMeta,
      })
    created += 1
  }

  pulled = updated + created

  const googleById = new Map<string, any>()
  googleEvents.forEach((event) => {
    if (event.id) googleById.set(event.id, event)
  })

  let pushed = 0
  let deleted = 0

  for (const local of localRows) {
    const meta =
      local.meta && typeof local.meta === 'object'
        ? (local.meta as Record<string, unknown>)
        : {}
    const localStatus = (meta.status as string | undefined) || 'pendente'
    const isCancelled = localStatus === 'cancelado'
    const startAt = local.start_at
    const endAt = local.end_at

    if (local.external_event_id) {
      if (isCancelled) {
        const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId,
        )}/events/${encodeURIComponent(local.external_event_id)}`
        await fetchGoogle(deleteUrl, accessToken, { method: 'DELETE' })
        deleted += 1
        continue
      }

      const googleEvent = googleById.get(local.external_event_id)
      const googleUpdated = googleEvent?.updated as string | undefined
      const localUpdated = (meta.local_updated_at as string | undefined) || local.created_at
      if (googleUpdated && localUpdated) {
        const googleMs = new Date(googleUpdated).getTime()
        const localMs = new Date(localUpdated).getTime()
        if (googleMs > localMs && meta.google_updated) {
          continue
        }
      }

      const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId,
      )}/events/${encodeURIComponent(local.external_event_id)}`
      const response = await fetchGoogle(updateUrl, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({
          summary: local.title,
          description: local.description || undefined,
          location: local.location || undefined,
          start: { dateTime: startAt },
          end: { dateTime: endAt },
        }),
      })
      if (response.ok) {
        const updatedEvent = await response.json()
        const nextMeta = {
          ...meta,
          google_updated: updatedEvent.updated || null,
          google_status: updatedEvent.status || null,
          local_updated_at: new Date().toISOString(),
        }
        await supabase
          .from('agendamentos')
          .update({ meta: nextMeta })
          .eq('id', local.id)
        pushed += 1
      }
      continue
    }

    if (isCancelled) {
      continue
    }

    const createUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId,
    )}/events`
    const response = await fetchGoogle(createUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        summary: local.title,
        description: local.description || undefined,
        location: local.location || undefined,
        start: { dateTime: startAt },
        end: { dateTime: endAt },
      }),
    })

    if (response.ok) {
      const createdEvent = await response.json()
      const nextMeta = {
        ...meta,
        google_updated: createdEvent.updated || null,
        google_status: createdEvent.status || null,
        local_updated_at: new Date().toISOString(),
      }
      await supabase
        .from('agendamentos')
        .update({
          external_provider: 'google_calendar',
          external_event_id: createdEvent.id,
          meta: nextMeta,
        })
        .eq('id', local.id)
      pushed += 1
    }
  }

  return {
    orgId,
    integrationId: integration.id,
    calendarId,
    pulled,
    updated,
    created,
    cancelled,
    pushed,
    deleted,
    googleCount: googleEvents.length,
    localCount: localRows.length,
  } satisfies SyncResult
}
