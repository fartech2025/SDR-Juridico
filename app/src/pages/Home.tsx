import React, { useEffect, useState } from 'react'
import TopBar from '@/components/TopBar'
import { CURRENT_USER_ID, hasSupabase, supabase } from '@/lib/supabaseClient'
import { UsuarioResumo } from '@/types'
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        if (!hasSupabase) throw new Error('Supabase não configurado (.env)')
        const { data: ru, error: e1 } = await supabase
          .from('resultados_usuarios')
          .select('id_usuario,total_questoes,total_acertos,total_erros,percentual_acertos,tempo_medio_resposta_ms')
          .eq('id_usuario', CURRENT_USER_ID)
          .maybeSingle()
        if (e1) throw e1

        const { data: rpt, error: e2 } = await supabase
          .from('resultados_por_tema')
          .select('id_tema,percentual')
          .eq('id_usuario', CURRENT_USER_ID)
        if (e2) throw e2

        const ids = Array.from(new Set((rpt ?? []).map(r => r.id_tema)))
        let nomes = new Map<number, string>()
        if (ids.length) {
          const { data: temas, error: e3 } = await supabase
            .from('temas')
            .select('id_tema,nome_tema')
            .in('id_tema', ids as any)
          if (e3) throw e3
          temas?.forEach(t => nomes.set(t.id_tema, t.nome_tema))
        }

        const fortes = (rpt ?? []).filter(r => (r.percentual ?? 0) >= 70).map(r => nomes.get(r.id_tema) || `Tema ${r.id_tema}`).slice(0,5)
        const fracos = (rpt ?? []).filter(r => (r.percentual ?? 0) <= 40).map(r => nomes.get(r.id_tema) || `Tema ${r.id_tema}`).slice(0,5)

        const { data: u, error: e4 } = await supabase
          .from('usuarios')
          .select('id_usuario,nome')
          .eq('id_usuario', CURRENT_USER_ID)
          .maybeSingle()
        if (e4) throw e4

        setResumo({
          id_usuario: CURRENT_USER_ID,
          nome: u?.nome ?? 'Aluno(a)',
          total_questoes: ru?.total_questoes ?? 0,
          total_acertos: ru?.total_acertos ?? 0,
          total_erros: ru?.total_erros ?? 0,
          percentual_acertos: Number(ru?.percentual_acertos ?? 0),
          tempo_medio_resposta_ms: ru?.tempo_medio_resposta_ms ?? 0,
          pontosFortes: fortes,
          pontosFracos: fracos
        })
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar resumo')
      }
    })()
  }, [])

  const chartData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos },
    { name: 'Erros', value: resumo.total_erros }
  ] : []

  return (
    <>
      <TopBar />
      <div className="container-max py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Painel do Aluno</h1>

        {error && (
          <div className="card p-3">
            <p className="text-sm text-red-300">Falha ao carregar dados: {error}</p>
          </div>
        )}

        {resumo ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4">
              <h2 className="font-medium mb-2 text-blue-400">Resumo</h2>
              <p className="text-sm text-slate-300">Aluno: {resumo.nome}</p>
              <p className="text-sm">Percentual de acertos: {resumo.percentual_acertos.toFixed(1)}%</p>
              <p className="text-sm">Tempo médio/questão: {(resumo.tempo_medio_resposta_ms/1000).toFixed(2)}s</p>
            </div>

            <div className="card p-4 md:col-span-2">
              <h2 className="font-medium mb-2 text-blue-400">Acertos x Erros</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={chartData} cx="50%" cy="50%" outerRadius={80} label />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="font-medium mb-2 text-blue-400">Pontos Fortes</h2>
              <ul className="list-disc list-inside text-sm text-slate-300">
                {resumo.pontosFortes.length ? resumo.pontosFortes.map(p => <li key={p}>{p}</li>) : <li>N/A</li>}
              </ul>
            </div>

            <div className="card p-4">
              <h2 className="font-medium mb-2 text-blue-400">Pontos Fracos</h2>
              <ul className="list-disc list-inside text-sm text-slate-300">
                {resumo.pontosFracos.length ? resumo.pontosFracos.map(p => <li key={p}>{p}</li>) : <li>N/A</li>}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300">Carregando...</p>
        )}
      </div>
    </>
  )
}