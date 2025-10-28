import React, { useEffect, useState } from 'react'
import TopBar from '@/components/TopBar'
import { hasSupabase, supabase } from '@/lib/supabaseClient'

type Row = { pos: number, nome: string, percentual: number, acertos: number, total: number }

const Ranking: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        if (!hasSupabase) throw new Error('Supabase não configurado (.env)')
        const { data: ru, error: e1 } = await supabase
          .from('resultados_usuarios')
          .select('id_usuario,total_questoes,total_acertos,percentual_acertos')
          .order('percentual_acertos', { ascending: false })
          .limit(20)
        if (e1) throw e1

        const ids = (ru ?? []).map(r => r.id_usuario)
        let nomes = new Map<number, string>()
        if (ids.length) {
          const { data: us, error: e2 } = await supabase
            .from('usuarios')
            .select('id_usuario,nome')
            .in('id_usuario', ids as any)
          if (e2) throw e2
          us?.forEach(u => nomes.set(u.id_usuario, u.nome))
        }

        const combined: Row[] = (ru ?? []).map((r, idx) => ({
          pos: idx + 1,
          nome: nomes.get(r.id_usuario) ?? `Usuário ${r.id_usuario}`,
          percentual: Number(r.percentual_acertos ?? 0),
          acertos: r.total_acertos ?? 0,
          total: r.total_questoes ?? 0,
        }))
        setRows(combined)
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar ranking')
      }
    })()
  }, [])

  return (
    <>
      <TopBar />
      <div className="container-max py-6 space-y-4">
        <h1 className="text-2xl font-semibold">Ranking</h1>
        {error && (
          <div className="card p-3">
            <p className="text-sm text-red-300">Falha ao carregar ranking: {error}</p>
          </div>
        )}
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/70">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">Posição</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">Nome</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">% Acertos</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">Acertos</th>
                <th className="px-4 py-3 text-sm font-medium text-slate-300">Respondidas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pos} className="border-t border-slate-800/80">
                  <td className="px-4 py-3">{r.pos}</td>
                  <td className="px-4 py-3">{r.nome}</td>
                  <td className="px-4 py-3">{r.percentual.toFixed(1)}%</td>
                  <td className="px-4 py-3">{r.acertos}</td>
                  <td className="px-4 py-3">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default Ranking