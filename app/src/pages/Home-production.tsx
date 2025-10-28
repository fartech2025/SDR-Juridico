import React, { useEffect, useState } from 'react'
import { UsuarioResumo } from '@/types'
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Dados demo públicos - sem autenticação necessária
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
      } catch (e: any) {
        console.error('Erro ao carregar dados:', e)
        setError(e.message)
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      {/* Header Section - Responsivo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Dashboard ENEM 2024
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Bem-vindo, {resumo?.nome || 'Estudante'}!
          </p>
        </div>
        
        {/* Performance Card - Mobile First */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 lg:p-6 text-center lg:text-right min-w-[200px]">
          <div className="text-2xl lg:text-3xl font-bold text-white">
            {resumo?.percentual_acertos.toFixed(1) || '0'}%
          </div>
          <div className="text-blue-100 text-sm lg:text-base">Aproveitamento</div>
        </div>
      </div>

      {/* Cards de Estatísticas - Grid Responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-green-400">
            {resumo?.total_questoes || 95}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">
            <span className="hidden sm:inline">Questões </span>Disponíveis
          </div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-blue-400">
            {resumo?.total_acertos || 68}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Acertos</div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-red-400">
            {resumo?.total_erros || 27}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Erros</div>
        </div>
        
        <div className="card p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-purple-400">
            {resumo ? Math.round(resumo.tempo_medio_resposta_ms / 1000) : 145}s
          </div>
          <div className="text-xs sm:text-sm text-slate-400">
            <span className="hidden sm:inline">Tempo </span>Médio
          </div>
        </div>
      </div>

      {/* Gráfico e Informações - Layout Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Gráfico de Performance */}
        <div className="card p-4 sm:p-6">
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

        {/* Pontos Fortes/Fracos - Layout Responsivo */}
        <div className="space-y-3 sm:space-y-4">
          <div className="card p-3 sm:p-4">
            <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>Pontos Fortes</span>
            </h4>
            <div className="space-y-2">
              {(resumo?.pontosFortes || []).map((tema, idx) => (
                <div key={idx} className="text-sm text-slate-300 bg-green-900/20 rounded-lg p-2 border-l-2 border-green-500">
                  • {tema}
                </div>
              ))}
              {(!resumo?.pontosFortes?.length) && (
                <div className="text-sm text-slate-500 italic p-2">
                  Complete mais questões para análise
                </div>
              )}
            </div>
          </div>
          
          <div className="card p-3 sm:p-4">
            <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>Pontos Fracos</span>
            </h4>
            <div className="space-y-2">
              {(resumo?.pontosFracos || []).map((tema, idx) => (
                <div key={idx} className="text-sm text-slate-300 bg-red-900/20 rounded-lg p-2 border-l-2 border-red-500">
                  • {tema}
                </div>
              ))}
              {(!resumo?.pontosFracos?.length) && (
                <div className="text-sm text-slate-500 italic p-2">
                  Complete mais questões para análise
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema - Grid Responsivo */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>Sobre o Sistema</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400">Questões ENEM 2024:</div>
            <div className="font-semibold text-green-400">95 questões extraídas</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400">Temas Classificados:</div>
            <div className="font-semibold text-blue-400">12 temas identificados</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-slate-400">Status do Sistema:</div>
            <div className="font-semibold text-green-400">
              ✅ Sistema Público Ativo
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}