import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import BasePage from '../components/BasePage';

export default function DatabaseInspetor() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTables() {
      setError(null);
      try {
        const { data, error } = await supabase.rpc('pg_list_tables');
        if (error) throw error;
        setTables(data || []);
      } catch (e: any) {
        setError('Erro ao buscar tabelas: ' + (e.message || e));
      }
    }
    fetchTables();
  }, []);

  async function fetchRows(table: string) {
    setLoading(true);
    setError(null);
    setSelectedTable(table);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(100);
      if (error) throw error;
      setRows(data || []);
    } catch (e: any) {
      setError('Erro ao buscar dados: ' + (e.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BasePage maxWidth="max-w-5xl">
      <div className="w-full p-6 space-y-6">
        <h1 className="text-2xl font-bold">🗄️ Database Inspetor</h1>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl">{error}</div>}
        <div className="flex flex-wrap gap-2 mb-4">
          {tables.map((table) => (
            <button
              key={table}
              className={`btn btn-ghost ${selectedTable === table ? 'bg-blue-800/40' : ''}`}
              onClick={() => fetchRows(table)}
            >
              {table}
            </button>
          ))}
        </div>
        {loading && <div className="text-slate-300">Carregando dados...</div>}
        {selectedTable && !loading && (
          <div className="overflow-x-auto bg-slate-900/60 rounded-xl p-4 border border-slate-700">
            <h2 className="font-semibold mb-2">Tabela: {selectedTable}</h2>
            {rows.length === 0 ? (
              <div className="text-slate-400">Nenhum dado encontrado.</div>
            ) : (
              <table className="min-w-full text-xs text-slate-200">
                <thead>
                  <tr>
                    {Object.keys(rows[0]).map((col) => (
                      <th key={col} className="px-2 py-1 text-left font-bold border-b border-slate-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </BasePage>
  );
}
