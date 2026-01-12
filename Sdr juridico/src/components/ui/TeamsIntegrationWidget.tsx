import { useTeamsSync } from '@/hooks/useTeamsSync'
import { RefreshCw, Link2, CheckCircle, AlertCircle } from 'lucide-react'

export function TeamsIntegrationWidget() {
  const { isConnected, isLoading, error, lastSync, eventCount, link, sync, refresh } = useTeamsSync()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Microsoft Teams</h3>
          <p className="text-sm text-gray-500 mt-1">Integre suas reuniões do Teams com a agenda</p>
        </div>
        <div className="text-3xl">🔗</div>
      </div>

      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span className="font-medium">Conectado ao Teams</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle size={20} />
            <span className="font-medium">Não conectado</span>
          </div>
        )}

        {lastSync && (
          <p className="text-xs text-gray-600">
            Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
          </p>
        )}

        {eventCount > 0 && (
          <p className="text-xs text-gray-600">
            {eventCount} evento{eventCount !== 1 ? 's' : ''} sincronizado{eventCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        {!isConnected ? (
          <button
            onClick={link}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            <Link2 size={18} />
            {isLoading ? 'Conectando...' : 'Conectar ao Teams'}
          </button>
        ) : (
          <>
            <button
              onClick={sync}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              title="Atualizar status"
            >
              <RefreshCw size={18} />
            </button>
          </>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error.message}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 space-y-2">
        <p className="font-medium">Como funciona:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Conecte sua conta Microsoft Teams</li>
          <li>Reuniões criadas aparecerão automaticamente na agenda</li>
          <li>Sincronize para importar reuniões existentes</li>
          <li>Os links das reuniões são salvos no campo "Local"</li>
        </ul>
      </div>
    </div>
  )
}
