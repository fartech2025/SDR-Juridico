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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
      
      <TopBar />
      
      <div className="relative container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">📝</span>
            Provas ENEM
          </h1>
          <p className="text-slate-300 text-lg">Selecione uma prova para começar seus estudos</p>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <input
                  type="search"
                  inputMode="numeric"
                  placeholder="🔍 Filtrar por ano..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/')}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    📊 Estatísticas
                  </span>
                </button>
                <button 
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-6 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={load} 
                  disabled={loading}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? '🔄 Atualizando...' : '🔄 Atualizar'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm glass-card">
            <p className="text-red-400 text-center">⚠️ Falha ao carregar provas: {error}</p>
          </div>
        )}

        {/* Provas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtradas.map((item) => (
            <div key={item.id_prova} className="glass-card p-6 hover-lift group">
              <ProvaCard item={item} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtradas.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma prova encontrada</h3>
            <p className="text-slate-300">Tente ajustar os filtros de busca.</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse-glow">⏳</div>
            <h3 className="text-2xl font-bold text-white mb-2">Carregando provas...</h3>
            <p className="text-slate-300">Aguarde enquanto buscamos as informações.</p>
          </div>
        )}
      </div>
    </div>
  )
}