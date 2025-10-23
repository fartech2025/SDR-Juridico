import React, { useCallback, useEffect, useMemo, useState } from 'react'
import TopBar from '@/components/TopBar'
import ProvaCard from '@/components/ProvaCard'
import { ProvaItem } from '@/types'
import { CURRENT_USER_ID, hasSupabase, supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Provas() {
  const [items, setItems] = useState<ProvaItem[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!hasSupabase) throw new Error('Supabase não configurado (.env)')
      const { data: pr, error: e1 } = await supabase.from('provas').select('id_prova,ano').order('ano', { ascending: false })
      if (e1) throw e1
      const { data: qs, error: e2 } = await supabase.from('questoes').select('id_questao,id_prova')
      if (e2) throw e2
      const { data: rs, error: e3 } = await supabase.from('respostas_usuarios').select('id_questao').eq('id_usuario', CURRENT_USER_ID)
      if (e3) throw e3

      const byProva = new Map<number, number[]>()
      qs?.forEach(q => {
        if (!byProva.has(q.id_prova)) byProva.set(q.id_prova, [])
        byProva.get(q.id_prova)!.push(q.id_questao)
      })
      const answered = new Set((rs ?? []).map(r => r.id_questao))

      const enriched: ProvaItem[] = (pr ?? []).map(p => {
        const ids = byProva.get(p.id_prova) ?? []
        const respondidas = ids.filter(id => answered.has(id)).length
        return { id_prova: p.id_prova, ano: p.ano, totalQuestoes: ids.length, respondidas }
      })
      setItems(enriched)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar provas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtradas = useMemo(() => {
    const q = query.trim()
    if (!q) return items
    const n = Number(q)
    return items.filter(p => isNaN(n) ? String(p.ano).includes(q) : p.ano === n)
  }, [items, query])

  return (
    <>
      <TopBar />
      <div className="container-max py-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="search"
            inputMode="numeric"
            placeholder="Filtrar por ano..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="btn" onClick={() => navigate('/')}>Ver Estatísticas</button>
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {error && (
          <div className="card p-3">
            <p className="text-sm text-red-300">Falha ao carregar provas: {error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
          {filtradas.map((item) => (
            <ProvaCard key={item.id_prova} item={item} />
          ))}
        </div>
      </div>
    </>
  )
}