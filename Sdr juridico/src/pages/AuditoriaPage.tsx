import * as React from 'react'
import { Filter, Search, ShieldCheck } from 'lucide-react'

import { PageState } from '@/components/PageState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { auditLogsService, type AuditLogEntry } from '@/services/auditLogsService'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

type ActionFilter = 'todos' | 'create' | 'update' | 'delete'

const actionLabel = (action: string) => {
  if (action === 'create') return 'Criado'
  if (action === 'update') return 'Atualizado'
  if (action === 'delete') return 'Removido'
  return action
}

const actionVariant = (action: string): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
  if (action === 'create') return 'success'
  if (action === 'update') return 'warning'
  if (action === 'delete') return 'danger'
  return 'default'
}

const formatDetails = (details: Record<string, any> | null | undefined) => {
  if (!details) return 'Sem detalhes'
  const fields = details.fields
  if (Array.isArray(fields) && fields.length) {
    return `Campos: ${fields.join(', ')}`
  }
  return 'Detalhes disponiveis'
}

const entityOptions = [
  { label: 'Todas', value: 'todos' },
  { label: 'Casos', value: 'casos' },
  { label: 'Clientes', value: 'clientes' },
  { label: 'Leads', value: 'leads' },
  { label: 'Tarefas', value: 'tarefas' },
  { label: 'Documentos', value: 'documentos' },
  { label: 'Agenda', value: 'agendamentos' },
  { label: 'Notas', value: 'notas' },
  { label: 'Auth', value: 'auth' },
] as const

export const AuditoriaPage = () => {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [actionFilter, setActionFilter] = React.useState<ActionFilter>('todos')
  const [entityFilter, setEntityFilter] = React.useState<(typeof entityOptions)[number]['value']>('todos')

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const trimmedSearch = searchTerm.trim()
      const data = await auditLogsService.getAuditLogs({
        action: actionFilter === 'todos' ? null : actionFilter,
        entity: entityFilter === 'todos' ? null : entityFilter,
        search: trimmedSearch || null,
      })
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar auditoria'))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter, searchTerm])

  React.useEffect(() => {
    fetchLogs().catch(() => null)
  }, [fetchLogs])

  const pageState = loading ? 'loading' : error ? 'error' : logs.length ? 'ready' : 'empty'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text">Auditoria</h1>
            <p className="text-sm text-text-subtle">Acompanhe mudancas e acessos.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9 rounded-full px-4">
          Atualizar
        </Button>
      </header>

      <Card className="border-border bg-white/85">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Filtros</CardTitle>
          <Filter className="h-4 w-4 text-text-subtle" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <Input
              placeholder="Buscar por entidade, usuario ou acao"
              className="h-10 rounded-full border border-border bg-surface-2 pl-9 text-sm text-text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-full border border-border bg-white px-4 text-sm text-text shadow-soft"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value as ActionFilter)}
          >
            <option value="todos">Todas as acoes</option>
            <option value="create">Criacoes</option>
            <option value="update">Atualizacoes</option>
            <option value="delete">Remocoes</option>
          </select>
          <select
            className="h-10 rounded-full border border-border bg-white px-4 text-sm text-text shadow-soft"
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value as typeof entityOptions[number]['value'])}
          >
            {entityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <PageState status={pageState}>
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-subtle">
                <div className="flex items-center gap-2">
                  <Badge variant={actionVariant(log.action)}>{actionLabel(log.action)}</Badge>
                  <span className="font-medium text-text">
                    {log.entity || 'entidade'} {log.entity_id ? `#${log.entity_id}` : ''}
                  </span>
                </div>
                <span>{formatDateTime(log.created_at)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-subtle">
                <span>Usuario: {log.actor_user_id || 'sistema'}</span>
                <span>-</span>
                <span>{formatDetails(log.details)}</span>
              </div>
            </div>
          ))}

          {logs.length === 0 && !loading && !error && (
            <div className="rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-text-muted shadow-soft">
              Nenhum evento encontrado para os filtros atuais.
            </div>
          )}
        </div>
      </PageState>
    </div>
  )
}
