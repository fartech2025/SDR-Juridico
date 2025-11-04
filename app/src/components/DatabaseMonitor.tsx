import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TableStatus {
  name: string;
  status: 'connected' | 'error' | 'loading';
  rowCount: number | null;
  error?: string;
  responseTime?: number;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function DatabaseMonitor() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [overallStatus, setOverallStatus] = useState<'connected' | 'partial' | 'error'>('partial');

  const tables = [
    'usuarios',
    'provas',
    'questoes',
    'questoes_imagens',
    'resultados_simulados',
  ];

  useEffect(() => {
    checkAllTables();
    const interval = setInterval(checkAllTables, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const checkAllTables = async () => {
    setLoading(true);
    const results: TableStatus[] = [];

    for (const table of tables) {
      const status = await checkTable(table);
      results.push(status);
    }

    setTableStatuses(results);
    setLastUpdate(new Date());

    // Determinar status geral
    const allConnected = results.every(r => r.status === 'connected');
    const anyConnected = results.some(r => r.status === 'connected');
    setOverallStatus(allConnected ? 'connected' : anyConnected ? 'partial' : 'error');
    setLoading(false);
  };

  const checkTable = async (tableName: string): Promise<TableStatus> => {
    const startTime = performance.now();
    
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const responseTime = Math.round(performance.now() - startTime);

      if (error) {
        return {
          name: tableName,
          status: 'error',
          rowCount: null,
          error: error.message,
          responseTime,
        };
      }

      return {
        name: tableName,
        status: 'connected',
        rowCount: count || 0,
        responseTime,
      };
    } catch (err: any) {
      const responseTime = Math.round(performance.now() - startTime);
      return {
        name: tableName,
        status: 'error',
        rowCount: null,
        error: err?.message || 'Unknown error',
        responseTime,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'loading':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '✓';
      case 'error':
        return '✗';
      case 'loading':
        return '⟳';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🗄️ Monitor de Banco de Dados</h1>
          <p className="text-slate-400">Status de conexão em tempo real com as tabelas</p>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Status Geral</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {overallStatus === 'connected' ? '✓ Conectado' : 
                   overallStatus === 'partial' ? '⚠ Parcial' : 
                   '✗ Desconectado'}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full ${
                overallStatus === 'connected' ? 'bg-green-500/20 border-2 border-green-500' :
                overallStatus === 'partial' ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                'bg-red-500/20 border-2 border-red-500'
              } flex items-center justify-center`}>
                <span className="text-2xl">
                  {overallStatus === 'connected' ? '✓' : 
                   overallStatus === 'partial' ? '⚠' : 
                   '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Tabelas Conectadas</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {tableStatuses.filter(t => t.status === 'connected').length}/{tableStatuses.length}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Última Atualização</p>
            <p className="text-xl font-bold text-white mt-2">
              {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* Tabelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableStatuses.map((table) => (
            <div
              key={table.name}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {/* Header da tabela */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-slate-300 font-medium">{table.name}</p>
                  <p className={`text-xs mt-1 ${
                    table.status === 'connected' ? 'text-green-400' :
                    table.status === 'loading' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {table.status === 'connected' ? 'Conectado' :
                     table.status === 'loading' ? 'Carregando...' :
                     'Erro de conexão'}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full ${getStatusColor(table.status)} flex items-center justify-center text-white font-bold`}>
                  {getStatusIcon(table.status)}
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-sm">
                {table.status === 'connected' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Registros:</span>
                      <span className="text-white font-medium">{table.rowCount?.toLocaleString('pt-BR') || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo Resposta:</span>
                      <span className="text-white font-medium">{table.responseTime}ms</span>
                    </div>
                    <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (table.responseTime || 0) / 10)}%`,
                        }}
                      />
                    </div>
                  </>
                )}

                {table.status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded p-2">
                    <p className="text-red-400 text-xs break-words">{table.error}</p>
                    {table.responseTime && (
                      <p className="text-slate-400 text-xs mt-1">Tempo: {table.responseTime}ms</p>
                    )}
                  </div>
                )}

                {table.status === 'loading' && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin">⟳</div>
                    <span className="text-slate-400">Verificando...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={checkAllTables}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? '⟳ Atualizando...' : '🔄 Atualizar Agora'}
          </button>
          
          <button
            onClick={() => {
              const text = tableStatuses.map(t => 
                `${t.name}: ${t.status === 'connected' ? '✓ OK' : '✗ Erro'}`
              ).join('\n');
              navigator.clipboard.writeText(text);
              alert('Status copiado para clipboard!');
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            📋 Copiar Status
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Atualizações automáticas a cada 30 segundos</p>
        </div>
      </div>
    </div>
  );
}
