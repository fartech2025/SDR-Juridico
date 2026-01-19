import { Calendar, RefreshCw, Loader, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface GoogleCalendarWidgetProps {
  isConnected: boolean
  isLoading?: boolean
  lastSync?: Date
  onConnect: () => void
  onSync: () => void
  disabled?: boolean
}

export function GoogleCalendarWidget({
  isConnected,
  isLoading = false,
  lastSync,
  onConnect,
  onSync,
  disabled = false,
}: GoogleCalendarWidgetProps) {
  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Card className="bg-surface border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary-subtle">
            <Calendar className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-text">
              Google Calendar
            </CardTitle>
            <p className="text-sm text-text-muted">
              Sincronize sua agenda automaticamente
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Conectado</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="flex items-start gap-3 p-3 bg-warning-bg rounded-lg border border-warning-border">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-dark">
                  Não conectado
                </p>
                <p className="text-sm mt-1 text-warning">
                  Clique em "Vincular" para autorizar o acesso ao seu Google Calendar
                </p>
              </div>
            </div>
            <Button
              onClick={onConnect}
              disabled={disabled || isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Vincular Google Calendar'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success-bg rounded-lg border border-success-border">
                <div>
                  <p className="text-sm font-medium text-success-dark">
                    Sincronização automática
                  </p>
                  <p className="text-xs mt-1 text-success">
                    {lastSync ? `Última: ${formatLastSync(lastSync)}` : 'Nunca sincronizado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onSync}
                disabled={disabled || isLoading}
                variant="outline"
                className="border-border text-text hover:bg-surface-alt"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>

              <Button
                onClick={onConnect}
                disabled={disabled || isLoading}
                variant="outline"
                className="border-border text-text hover:bg-surface-alt"
              >
                Reconectar
              </Button>
            </div>

            <div className="text-xs p-3 rounded-lg bg-surface-alt text-text-muted">
              <p className="font-medium mb-1 text-text">ℹ️ Sincronização:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Eventos são sincronizados a cada hora automaticamente</li>
                <li>Você pode sincronizar manualmente a qualquer momento</li>
                <li>Alterações na agenda aparecem no Google Calendar em minutos</li>
                <li>Google Calendar é fonte primária para eventos criados lá</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
