import React, { useEffect, useState } from 'react'
import { UsuarioResumo, Prova, Tema } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import ChatGPTStyleSidebar from '../components/ui/ChatGPTStyleSidebar'

const demoResumo: UsuarioResumo = {
  id_usuario: 0,
  nome: 'Estudante Demo',
  total_questoes: 95,
  total_acertos: 68,
  total_erros: 27,
  percentual_acertos: 71.6,
  tempo_medio_resposta_ms: 145000,
  pontosFortes: ['Literatura', 'Interpretação de texto', 'Gramática'],
  pontosFracos: ['Matemática', 'Física', 'Química']
}

const demoProvas: Prova[] = [
  { id_prova: 1, ano: 2024, descricao: 'Simulado ENEM 2024 - Linguagens' },
  { id_prova: 2, ano: 2023, descricao: 'Simulado ENEM 2023 - Linguagens' }
]

const demoTemas: Tema[] = [
  { id_tema: 1, nome_tema: 'Literatura' },
  { id_tema: 2, nome_tema: 'Interpretação de texto' },
  { id_tema: 3, nome_tema: 'Gramática' }
]

export default function HomeProduction() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [provas, setProvas] = useState<Prova[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aproveitamentoPorTema, setAproveitamentoPorTema] = useState<any[]>([])

  // Função para carregar dados de aproveitamento por tema
  const loadAproveitamentoPorTema = async () => {
    try {
      const { data: temaData } = await supabase
        .from('resultados_por_tema')
        .select('nome_tema, percentual_acertos')
        .eq('id_usuario', 1)

      if (temaData) {
        const formattedData = temaData.map((item) => ({
          name: item.nome_tema,
          score: item.percentual_acertos
        }))
        setAproveitamentoPorTema(formattedData)
      }
    } catch (err) {
      console.error('Erro ao carregar aproveitamento por tema:', err)
    }
  }

  // Função para carregar provas e temas
  const loadProvasETemas = async () => {
    try {
      const [provasResponse, temasResponse] = await Promise.all([
        supabase.from('provas').select('*').order('ano', { ascending: false }),
        supabase.from('temas').select('*').order('nome_tema')
      ])

      if (provasResponse.data) {
        console.log('✅ Provas carregadas:', provasResponse.data)
        setProvas(provasResponse.data)
      }
      
      if (temasResponse.data) {
        console.log('✅ Temas carregados:', temasResponse.data)
        setTemas(temasResponse.data)
      }
    } catch (err) {
      console.error('❌ Erro ao carregar provas e temas:', err)
      setProvas(demoProvas)
      setTemas(demoTemas)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await loadProvasETemas()
        await loadAproveitamentoPorTema()

        const { data: resumoData, error: resumoError } = await supabase
          .from('usuario_resumo')
          .select('*')
          .eq('id_usuario', 1)
          .single()

        if (resumoError) {
          console.warn('⚠️ Erro ao buscar resumo no Supabase:', resumoError.message)
          setResumo(demoResumo)
        } else if (resumoData) {
          console.log('✅ Resumo carregado do Supabase:', resumoData)
          setResumo(resumoData)
        }
      } catch (err) {
        console.error('❌ Erro geral:', err)
        setError('Erro ao carregar dados. Usando modo demonstração.')
        setResumo(demoResumo)
        setProvas(demoProvas)
        setTemas(demoTemas)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('🚨 Erro na aplicação:', error)
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Persistent Sidebar Vertical - Estilo ChatGPT */}
      <ChatGPTStyleSidebar
        provas={provas}
        temas={temas}
        provaSelecionada={provaSelecionada}
        temaSelecionado={temaSelecionado}
        onProvaChange={setProvaSelecionada}
        onTemaChange={setTemaSelecionado}
        aproveitamentoPorTema={aproveitamentoPorTema}
      />
      {/* Main Content com margem para sidebar */}
      <main style={{ 
        marginLeft: '280px', 
        padding: '24px',
        paddingTop: '24px',
        minHeight: '100vh',
        backgroundColor: 'transparent'
      }}>
        {/* Header integrado no conteúdo */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.8)', 
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📚</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Dashboard ENEM 2024
                  </h1>
                  <p className="text-sm text-slate-400">
                    Bem-vindo, <span className="text-white font-medium">{resumo?.nome || 'Estudante'}</span>!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Status de Conexão */}
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                <span>Modo Demo</span>
              </div>
            </div>
          </div>
        </div>
        {/* Status de Conexão */}
        <div style={{ marginBottom: '24px' }}>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-200">
              <span className="text-xl">🔧</span>
              <span className="font-medium">
                Modo demonstração - Configure o Supabase para dados reais
              </span>
            </div>
          </div>
        </div>

          {/* Debug Info - apenas durante desenvolvimento */}
          {import.meta.env.DEV && (
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
              <h3 className="text-yellow-200 font-medium mb-2">🔧 Debug Info:</h3>
              <div className="text-sm text-yellow-100 space-y-1">
                <p>Provas carregadas: {provas.length}</p>
                <p>Temas carregados: {temas.length}</p>
                <p>Prova selecionada: {provaSelecionada || 'nenhuma'}</p>
                <p>Tema selecionado: {temaSelecionado || 'nenhum'}</p>
                <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</p>
                <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
              </div>
            </div>
          )}

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
          <div className="glass-card p-6 backdrop-blur-xl">
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
      </main>
    </div>
  )
}