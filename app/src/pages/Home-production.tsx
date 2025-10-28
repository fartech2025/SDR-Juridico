import React, { useEffect, useState } from 'react'
import { hasSupabase, supabase, CURRENT_USER_ID } from '@/lib/supabaseClient'
import { UsuarioResumo } from '@/types'
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!hasSupabase) {
          // Dados mock para demonstração
          setResumo({
            id_usuario: 1,
            nome: 'Estudante Demo',
            total_questoes: 95,
            total_acertos: 68,
            total_erros: 27,
            percentual_acertos: 71.6,
            tempo_medio_resposta_ms: 145000,
            pontosFortes: ['Literatura', 'Interpretação de texto', 'Gramática'],
            pontosFracos: ['Matemática', 'Física', 'Química']
          })
          setLoading(false)
          return
        }

        // Tentar carregar dados reais do Supabase
        const { data: ru, error: e1 } = await supabase
          .from('resultados_usuarios')
          .select('id_usuario,total_questoes,total_acertos,total_erros,percentual_acertos,tempo_medio_resposta_ms')
          .eq('id_usuario', CURRENT_USER_ID)
          .maybeSingle()

        if (e1) throw e1

        if (ru) {
          setResumo({
            ...ru,
            nome: 'Usuário',
            pontosFortes: ['Literatura', 'Interpretação'],
            pontosFracos: ['Matemática', 'Ciências']
          })
        } else {
          // Dados padrão se não houver dados no banco
          setResumo({
            id_usuario: CURRENT_USER_ID,
            nome: 'Novo Usuário',
            total_questoes: 0,
            total_acertos: 0,
            total_erros: 0,
            percentual_acertos: 0,
            tempo_medio_resposta_ms: 0,
            pontosFortes: [],
            pontosFracos: []
          })
        }
      } catch (e: any) {
        console.error('Erro ao carregar dados:', e)
        setError(e.message)
        // Fallback para dados demo
        setResumo({
          id_usuario: 1,
          nome: 'Modo Demo',
          total_questoes: 95,
          total_acertos: 68,
          total_erros: 27,
          percentual_acertos: 71.6,
          tempo_medio_resposta_ms: 145000,
          pontosFortes: ['Literatura', 'Interpretação de texto'],
          pontosFracos: ['Matemática', 'Física']
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-slate-700 rounded"></div>
            <div className="h-32 bg-slate-700 rounded"></div>
            <div className="h-32 bg-slate-700 rounded"></div>
            <div className="h-32 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !resumo) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-800 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold mb-2">Erro de Conexão</h2>
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-slate-400 text-xs mt-2">Exibindo dados de demonstração...</p>
        </div>
      </div>
    )
  }

  const chartData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos, color: '#10b981' },
    { name: 'Erros', value: resumo.total_erros, color: '#ef4444' }
  ] : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard ENEM 2024</h1>
          <p className="text-slate-400">Bem-vindo, {resumo?.nome || 'Estudante'}!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">
            {resumo?.percentual_acertos.toFixed(1) || '0'}%
          </div>
          <div className="text-sm text-slate-500">Aproveitamento</div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-400">
            {resumo?.total_questoes || 95}
          </div>
          <div className="text-sm text-slate-400">Questões Disponíveis</div>
        </div>
        
        <div className="card p-4">
          <div className="text-2xl font-bold text-blue-400">
            {resumo?.total_acertos || 68}
          </div>
          <div className="text-sm text-slate-400">Acertos</div>
        </div>
        
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-400">
            {resumo?.total_erros || 27}
          </div>
          <div className="text-sm text-slate-400">Erros</div>
        </div>
        
        <div className="card p-4">
          <div className="text-2xl font-bold text-purple-400">
            {resumo ? Math.round(resumo.tempo_medio_resposta_ms / 1000) : 145}s
          </div>
          <div className="text-sm text-slate-400">Tempo Médio</div>
        </div>
      </div>

      {/* Gráfico e Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Geral</h3>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pontos Fortes/Fracos */}
        <div className="space-y-4">
          <div className="card p-4">
            <h4 className="font-semibold text-green-400 mb-2">✅ Pontos Fortes</h4>
            <div className="space-y-1">
              {(resumo?.pontosFortes || []).map((tema, idx) => (
                <div key={idx} className="text-sm text-slate-300">• {tema}</div>
              ))}
              {(!resumo?.pontosFortes?.length) && (
                <div className="text-sm text-slate-500">Complete mais questões para análise</div>
              )}
            </div>
          </div>
          
          <div className="card p-4">
            <h4 className="font-semibold text-red-400 mb-2">⚠️ Pontos Fracos</h4>
            <div className="space-y-1">
              {(resumo?.pontosFracos || []).map((tema, idx) => (
                <div key={idx} className="text-sm text-slate-300">• {tema}</div>
              ))}
              {(!resumo?.pontosFracos?.length) && (
                <div className="text-sm text-slate-500">Complete mais questões para análise</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="card p-4">
        <h3 className="font-semibold mb-2">📊 Sobre o Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Questões ENEM 2024:</div>
            <div className="font-semibold text-green-400">95 questões extraídas</div>
          </div>
          <div>
            <div className="text-slate-400">Temas Classificados:</div>
            <div className="font-semibold text-blue-400">12 temas identificados</div>
          </div>
          <div>
            <div className="text-slate-400">Status do Banco:</div>
            <div className={`font-semibold ${hasSupabase ? 'text-green-400' : 'text-yellow-400'}`}>
              {hasSupabase ? '✅ Conectado' : '⚠️ Modo Demo'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}