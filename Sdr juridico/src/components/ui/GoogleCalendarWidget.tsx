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
  isDark?: boolean
}

export function GoogleCalendarWidget({
  isConnected,
  isLoading = false,
  lastSync,
  onConnect,
  onSync,
  disabled = false,
  isDark = false,
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
    <Card className={isDark ? 'dark:bg-slate-900 dark:border-slate-700' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'dark:bg-blue-900/30' : 'bg-blue-100'}`}>
            <Calendar className={`w-5 h-5 ${isDark ? 'dark:text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <CardTitle className={isDark ? 'dark:text-slate-200' : ''}>
              Google Calendar
            </CardTitle>
            <p className={`text-sm ${isDark ? 'dark:text-slate-400' : 'text-gray-600'}`}>
              Sincronize sua agenda automaticamente
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Conectado</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Não conectado
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'dark:text-amber-300/80' : 'text-amber-700'}`}>
                  Clique em "Vincular" para autorizar o acesso ao seu Google Calendar
                </p>
              </div>
            </div>
            <Button
              onClick={onConnect}
              disabled={disabled || isLoading}
              className={`w-full ${isDark ? 'dark:bg-blue-600 dark:hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
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
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/50">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-200">
                    Sincronização automática
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'dark:text-green-300/70' : 'text-green-700'}`}>
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
                className={`${isDark ? 'dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800' : ''}`}
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
                className={`${isDark ? 'dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800' : ''}`}
              >
                Reconectar
              </Button>
            </div>

            <div className={`text-xs p-3 rounded-lg ${isDark ? 'dark:bg-slate-800 dark:text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
              <p className="font-medium mb-1">ℹ️ Sincronização:</p>
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
