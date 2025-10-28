import React, { useEffect, useState } from 'react'
import { UsuarioResumo } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
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
      <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse max-w-7xl mx-auto">
          <div className="h-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Dados para gráficos
  const pieData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos, color: '#10b981' },
    { name: 'Erros', value: resumo.total_erros, color: '#ef4444' }
  ] : []

  const subjectData = [
    { name: 'Literatura', score: 85, color: '#10b981' },
    { name: 'Matemática', score: 65, color: '#f59e0b' },
    { name: 'Física', score: 58, color: '#ef4444' },
    { name: 'Química', score: 72, color: '#8b5cf6' },
  ]

  const colors = ['#10b981', '#ef4444']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Moderno */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Dashboard ENEM 2024
              </h1>
              <p className="text-slate-300 text-lg flex items-center gap-2">
                <span className="text-2xl">👋</span>
                Bem-vindo, <span className="font-semibold text-white">{resumo?.nome || 'Estudante'}</span>!
              </p>
            </div>
            
            {/* Performance Circular */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white">
                      {resumo?.percentual_acertos.toFixed(1) || '0'}%
                    </div>
                    <div className="text-xs text-blue-300 font-medium">Performance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: 'Questões', 
              value: resumo?.total_questoes || 95, 
              icon: '📊', 
              color: 'from-emerald-500 to-teal-600'
            },
            { 
              title: 'Acertos', 
              value: resumo?.total_acertos || 68, 
              icon: '✅', 
              color: 'from-blue-500 to-cyan-600'
            },
            { 
              title: 'Erros', 
              value: resumo?.total_erros || 27, 
              icon: '❌', 
              color: 'from-red-500 to-pink-600'
            },
            { 
              title: 'Tempo', 
              value: `${resumo ? Math.round(resumo.tempo_medio_resposta_ms / 1000) : 145}s`, 
              icon: '⏱️', 
              color: 'from-purple-500 to-indigo-600'
            }
          ].map((stat, index) => (
            <div key={index} className="group hover:scale-105 transition-all duration-300">
              <div className={`bg-gradient-to-br ${stat.color} p-1 rounded-2xl shadow-lg`}>
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-slate-300 text-sm font-medium">
                    {stat.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Seção de Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Chart Principal */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📈</span>
              Performance Geral
            </h3>
            
            <div className="relative">
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={450}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {/* Texto Central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">
                    {resumo?.percentual_acertos.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-400">Taxa de Acerto</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart por Matéria */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📚</span>
              Performance por Matéria
            </h3>
            
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pontos Fortes e Fracos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pontos Fortes */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              Pontos Fortes
            </h4>
            <div className="space-y-3">
              {(resumo?.pontosFortes || ['Literatura', 'Interpretação de texto', 'Gramática']).map((tema, idx) => (
                <div key={idx} className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white font-medium">{tema}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pontos Fracos */}
          <div className="bg-gradient-to-br from-red-500/10 to-pink-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              Áreas para Melhorar
            </h4>
            <div className="space-y-3">
              {(resumo?.pontosFracos || ['Matemática', 'Física', 'Química']).map((tema, idx) => (
                <div key={idx} className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-white font-medium">{tema}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            Sistema ENEM 2024
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Questões ENEM 2024',
                value: '95 questões extraídas',
                icon: '📝',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Temas Classificados',
                value: '12 temas identificados',
                icon: '🏷️',
                color: 'from-purple-500 to-pink-500'
              },
              {
                title: 'Status do Sistema',
                value: 'Sistema Público Ativo',
                icon: '✅',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((info, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-300">
                <div className={`bg-gradient-to-br ${info.color} p-1 rounded-xl shadow-lg`}>
                  <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 h-full">
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {info.icon}
                      </div>
                      <div className="text-slate-300 text-xs font-medium mb-1">
                        {info.title}
                      </div>
                      <div className="text-white font-bold text-sm">
                        {info.value}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}