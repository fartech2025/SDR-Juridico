
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProvaCard from '@/components/ProvaCard';
import { ProvaItem } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import BasePage from '../components/BasePage';

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
  // Modo demo sempre ativo
      const { data: pr, error: e1 } = await supabase.from('provas').select('id_prova,ano').order('ano', { ascending: false })
      if (e1) throw e1
      const { data: qs, error: e2 } = await supabase.from('questoes').select('id_questao,id_prova')
      if (e2) throw e2
  const { data: rs, error: e3 } = await supabase.from('respostas_usuarios').select('id_questao').eq('id_usuario', 1)
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
    <BasePage maxWidth="max-w-6xl">
      <div className="relative w-full px-2 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="ds-heading text-3xl flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">📝</span>
            Provas ENEM
          </h1>
          <p className="ds-muted text-lg">Selecione uma prova para começar seus estudos</p>
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
                  className="input-field w-full"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/')}
                >
                  <span className="flex items-center gap-2">📊 Estatísticas</span>
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={load} 
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">{loading ? '🔄 Atualizando...' : '🔄 Atualizar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-xl glass-card">
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
            <h3 className="ds-heading text-2xl mb-2">Nenhuma prova encontrada</h3>
            <p className="ds-muted">Tente ajustar os filtros de busca.</p>
          </div>
        )}
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse-glow">⏳</div>
            <h3 className="ds-heading text-2xl mb-2">Carregando provas...</h3>
            <p className="ds-muted">Aguarde enquanto buscamos as informações.</p>
          </div>
        )}
      </div>
    </BasePage>
  );
}