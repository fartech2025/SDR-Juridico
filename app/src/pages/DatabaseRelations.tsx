import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import BasePage from '../components/BasePage';

interface Relation {
  tabela_origem: string;
  coluna_origem: string;
  tabela_destino: string;
  coluna_destino: string;
}

export default function DatabaseRelations() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRelations() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('pg_foreign_keys');
        if (error) throw error;
        setRelations(data || []);
      } catch (e: any) {
        setError('Erro ao buscar relações: ' + (e.message || e));
      } finally {
        setLoading(false);
      }
    }
    fetchRelations();
  }, []);

  return (
    <BasePage maxWidth="max-w-4xl">
      <div className="w-full p-6 space-y-6">
        <h1 className="text-2xl font-bold">🔗 Relações entre Tabelas</h1>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 mb-4">
          <b>Para visualizar as relações, execute este SQL no Supabase:</b>
          <pre className="whitespace-pre-wrap mt-2 text-slate-100 bg-slate-900/60 p-2 rounded">
{`
create or replace function pg_foreign_keys()
returns table(
  tabela_origem text,
  coluna_origem text,
  tabela_destino text,
  coluna_destino text
)
language sql
as $$
  select
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino
  from
    information_schema.table_constraints as tc
    join information_schema.key_column_usage as kcu
      on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage as ccu
      on ccu.constraint_name = tc.constraint_name
  where
    tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public';
$$;

grant execute on function pg_foreign_keys() to anon;
`}
          </pre>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-4 rounded-xl">{error}</div>}
        {loading && <div className="text-slate-300">Carregando relações...</div>}
        {!loading && relations.length > 0 && (
          <table className="min-w-full text-xs text-slate-200 bg-slate-900/60 rounded-xl">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-bold border-b border-slate-700">Tabela Origem</th>
                <th className="px-2 py-1 text-left font-bold border-b border-slate-700">Coluna Origem</th>
                <th className="px-2 py-1 text-left font-bold border-b border-slate-700">Tabela Destino</th>
                <th className="px-2 py-1 text-left font-bold border-b border-slate-700">Coluna Destino</th>
              </tr>
            </thead>
            <tbody>
              {relations.map((rel, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="px-2 py-1 whitespace-nowrap">{rel.tabela_origem}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{rel.coluna_origem}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{rel.tabela_destino}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{rel.coluna_destino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && relations.length === 0 && !error && (
          <div className="text-slate-400">Nenhuma relação encontrada.</div>
        )}
        <div className="flex justify-end pt-6">
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">Voltar para Home</a>
        </div>
      </div>
    </BasePage>
  );
}
