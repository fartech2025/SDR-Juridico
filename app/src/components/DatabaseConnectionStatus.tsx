import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TableStatus {
  name: string;
  status: 'checking' | 'connected' | 'error';
  rowCount?: number;
  error?: string;
  responseTime?: number;
}

const TABLES = [
  'usuarios',
  'simulados',
  'questoes',
  'simulado_questoes',
  'questoes_imagens',
  'alternativas',
  'alternativas_imagens',
  'resultados_simulados',
  'resultados_questoes'
];

export default function DatabaseConnectionStatus() {
  const [tables, setTables] = useState<TableStatus[]>(
    TABLES.map(name => ({ name, status: 'checking' }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkAllTables();
    // Atualizar a cada 30 segundos
    const interval = setInterval(checkAllTables, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAllTables = async () => {
    const results: TableStatus[] = [];

    for (const tableName of TABLES) {
      const startTime = performance.now();
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        const responseTime = performance.now() - startTime;

        if (error) {
          results.push({
            name: tableName,
            status: 'error',
            error: error.message,
            responseTime
          });
        } else {
          results.push({
            name: tableName,
            status: 'connected',
            rowCount: count || 0,
            responseTime
          });
        }
      } catch (err: any) {
        const responseTime = performance.now() - startTime;
        results.push({
          name: tableName,
          status: 'error',
          error: err?.message || 'Erro desconhecido',
          responseTime
        });
      }
    }

    setTables(results);
    setLastUpdate(new Date());
    setIsLoading(false);
  };

  const getStatusColor = (status: TableStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200';
      case 'error':
        return 'bg-red-500/10 border-red-500/40 text-red-200';
      case 'checking':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-200';
    }
  };

  const getStatusIcon = (status: TableStatus['status']) => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'error':
        return '❌';
      case 'checking':
        return '⏳';
    }
  };

  const connectedCount = tables.filter(t => t.status === 'connected').length;
  const errorCount = tables.filter(t => t.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">🗄️ Status do Banco de Dados</h2>
          <div className="flex gap-3 text-sm">
            <div className="bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/40">
              <span className="text-emerald-300">✅ {connectedCount}</span>
            </div>
            <div className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/40">
              <span className="text-red-300">❌ {errorCount}</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          {isLoading && <span className="ml-2 inline-block animate-spin">⟳</span>}
        </div>
      </div>

      {/* Barra de progresso visual */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex gap-1 h-2 rounded-lg overflow-hidden">
          {tables.map((table, idx) => (
            <div
              key={idx}
              className={`flex-1 transition-colors ${
                table.status === 'connected'
                  ? 'bg-emerald-500'
                  : table.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
              title={table.name}
            />
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {connectedCount}/{tables.length} tabelas conectadas
        </div>
      </div>

      {/* Grid de tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((table) => (
          <div
            key={table.name}
            className={`p-4 rounded-xl border transition-all ${getStatusColor(table.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getStatusIcon(table.status)}</span>
                <h3 className="font-semibold text-sm">{table.name}</h3>
              </div>
            </div>

            <div className="text-xs space-y-1">
              {table.status === 'connected' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registros:</span>
                    <span className="font-mono">{table.rowCount?.toLocaleString('pt-BR') || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempo:</span>
                    <span className="font-mono">{table.responseTime?.toFixed(0)}ms</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs opacity-90">{table.error}</div>
                  {table.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo:</span>
                      <span className="font-mono">{table.responseTime?.toFixed(0)}ms</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão para atualizar manualmente */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsLoading(true);
            checkAllTables();
          }}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? '⏳ Atualizando...' : '🔄 Atualizar Agora'}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-500/10 border border-blue-500/40 text-blue-200 p-4 rounded-xl text-sm">
        <strong>ℹ️ Informações:</strong>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>O status de cada tabela é verificado automaticamente a cada 30 segundos</li>
          <li>Tempo de resposta em milissegundos (ms)</li>
          <li>Se uma tabela está ❌, pode haver problema de permissão, RLS ou a tabela não existe</li>
          <li>Clique em "Atualizar Agora" para verificação imediata</li>
        </ul>
      </div>
    </div>
  );
}
