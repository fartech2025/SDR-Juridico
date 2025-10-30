import React, { useEffect, useState } from 'react'
import { UsuarioResumo, Prova, Tema } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { hasSupabase, supabase, CURRENT_USER_ID } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import { ModernFilter, FilterGroup } from '@/components/ui/ModernFilter'
import { QuestionCard, QuestionGrid } from '@/components/ui/QuestionCard'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { 
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  CalendarIcon,
  TagIcon,
  PlayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

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

export default function HomeModern() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [provas, setProvas] = useState<Prova[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState('')
  const [filtersLoading, setFiltersLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Carregando dados reais do Supabase...')
        
        if (!hasSupabase || !supabase) {
          throw new Error('Supabase não configurado - verifique as variáveis de ambiente')
        }

        // Buscar dados reais do usuário
        console.log('👤 Buscando dados do usuário ID:', CURRENT_USER_ID)
        
        const { data: dadosUsuario, error: errorUsuario } = await supabase
          .from('resumo_usuarios')
          .select('*')
          .eq('id_usuario', CURRENT_USER_ID)
          .limit(1)

        if (errorUsuario) {
          console.error('❌ Erro ao buscar dados do usuário:', errorUsuario)
          console.log('🔄 Usando dados demo...')
          setResumo(demoResumo)
        } else if (dadosUsuario && dadosUsuario.length > 0) {
          console.log('✅ Dados do usuário encontrados:', dadosUsuario[0])
          setResumo(dadosUsuario[0])
        } else {
          console.log('⚠️ Nenhum dado encontrado para o usuário, usando demo')
          setResumo(demoResumo)
        }

        // Buscar anos únicos das questões
        console.log('📚 Buscando anos disponíveis...')
        setFiltersLoading(true)
        
        const { data: questoesData, error: questoesError } = await supabase
          .from('questoes')
          .select('ano')
          .not('ano', 'is', null)

        if (questoesError) {
          console.error('❌ Erro ao buscar questões:', questoesError)
          setProvas(demoProvas)
        } else {
          console.log('✅ Questões encontradas:', questoesData)
          // Agrupar por ano e contar
          const anosCount = questoesData.reduce((acc: Record<number, number>, item: any) => {
            acc[item.ano] = (acc[item.ano] || 0) + 1
            return acc
          }, {})
          
          const provasFormatadas: Prova[] = Object.entries(anosCount)
            .map(([ano, count]) => ({
              id_prova: parseInt(ano),
              ano: parseInt(ano),
              descricao: `ENEM ${ano} - ${count} questões`
            }))
            .sort((a, b) => b.ano - a.ano)
          
          setProvas(provasFormatadas)
        }

        // Buscar temas únicos
        console.log('🏷️ Buscando temas disponíveis...')
        
        const { data: temasData, error: temasError } = await supabase
          .from('questoes')
          .select('assunto_detalhado')
          .not('assunto_detalhado', 'is', null)

        if (temasError) {
          console.error('❌ Erro ao buscar temas:', temasError)
          setTemas(demoTemas)
        } else {
          console.log('✅ Temas encontrados:', temasData)
          // Agrupar temas únicos e contar
          const temasCount = temasData.reduce((acc: Record<string, number>, item: any) => {
            acc[item.assunto_detalhado] = (acc[item.assunto_detalhado] || 0) + 1
            return acc
          }, {})
          
          const temasFormatados: Tema[] = Object.entries(temasCount)
            .sort(([,a], [,b]) => b - a) // Ordenar por contagem
            .slice(0, 20) // Pegar apenas os 20 mais comuns
            .map(([tema], index) => ({
              id_tema: index + 1,
              nome_tema: tema
            }))
          
          setTemas(temasFormatados)
        }

      } catch (err) {
        console.error('❌ Erro geral:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setResumo(demoResumo)
        setProvas(demoProvas)
        setTemas(demoTemas)
      } finally {
        setLoading(false)
        setFiltersLoading(false)
      }
    }

    loadData()
  }, [])

  const pieData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos, color: '#10b981' },
    { name: 'Erros', value: resumo.total_erros, color: '#ef4444' }
  ] : []

  const barData = resumo ? [
    { name: 'Total', value: resumo.total_questoes },
    { name: 'Acertos', value: resumo.total_acertos },
    { name: 'Erros', value: resumo.total_erros }
  ] : []

  const provaOptions = provas.map(prova => ({
    value: prova.ano.toString(),
    label: `ENEM ${prova.ano}`,
    count: prova.descricao?.includes('questões') ? 
      parseInt(prova.descricao.match(/(\d+) questões/)?.[1] || '0') : undefined
  }))

  const temaOptions = temas.map(tema => ({
    value: tema.id_tema.toString(),
    label: tema.nome_tema
  }))

  // Dados de exemplo para as questões em destaque
  const questoesDestaque = [
    {
      id: '1',
      year: 2024,
      subject: 'Linguagens',
      theme: 'Literatura Contemporânea',
      difficulty: 'medium' as const,
      excerpt: 'Análise de obra literária contemporânea brasileira com foco em elementos narrativos e contexto histórico...',
      timeLimit: 3,
      viewCount: 1250,
      successRate: 68,
      tags: ['Literatura', 'Análise textual'],
      onStart: () => {},
    },
    {
      id: '2',
      year: 2023,
      subject: 'Linguagens',
      theme: 'Interpretação de Texto',
      difficulty: 'easy' as const,
      excerpt: 'Questão sobre compreensão e interpretação de texto jornalístico com análise de elementos coesivos...',
      timeLimit: 4,
      viewCount: 980,
      successRate: 82,
      tags: ['Interpretação', 'Coesão'],
      onStart: () => {},
      isCompleted: true,
      isCorrect: true,
    },
    {
      id: '3',
      year: 2024,
      subject: 'Linguagens',
      theme: 'Gramática e Sintaxe',
      difficulty: 'hard' as const,
      excerpt: 'Análise sintática complexa envolvendo períodos compostos e funções sintáticas avançadas...',
      timeLimit: 5,
      viewCount: 750,
      successRate: 45,
      tags: ['Gramática', 'Sintaxe'],
      onStart: () => {},
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="border-b border-slate-700/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <SparklesIcon className="w-8 h-8 text-blue-400" />
                  Dashboard ENEM
                </h1>
                <p className="text-slate-400">Carregando...</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-blue-400" />
                Dashboard ENEM
              </h1>
              <p className="text-slate-400">
                Bem-vindo de volta, {resumo?.nome || 'Estudante'}!
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="status-error p-4 rounded-lg">
            <p>⚠️ {error}</p>
            <p className="text-sm mt-1">Dados de demonstração sendo exibidos.</p>
          </div>
        )}

        {/* Stats Cards */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Questões */}
            <div className="glass-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total de Questões</p>
                  <p className="text-3xl font-bold text-white mt-1">{resumo.total_questoes}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <BookOpenIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Taxa de Acerto */}
            <div className="glass-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Taxa de Acerto</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{resumo.percentual_acertos.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <TrophyIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${resumo.percentual_acertos}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tempo Médio */}
            <div className="glass-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Tempo Médio</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">
                    {Math.round(resumo.tempo_medio_resposta_ms / 60000)}min
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <ClockIcon className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Acertos */}
            <div className="glass-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total de Acertos</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{resumo.total_acertos}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <AcademicCapIcon className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros Modernos */}
        <FilterGroup 
          title="Filtrar Questões" 
          description="Escolha o ano e tema para encontrar questões específicas"
        >
          <ModernFilter
            label="Ano da Prova"
            options={provaOptions}
            value={provaSelecionada}
            onChange={setProvaSelecionada}
            placeholder="Selecione o ano..."
            icon={<CalendarIcon className="w-4 h-4" />}
            loading={filtersLoading}
            searchable
          />

          <ModernFilter
            label="Tema"
            options={temaOptions}
            value={temaSelecionado}
            onChange={setTemaSelecionado}
            placeholder="Selecione um tema..."
            icon={<TagIcon className="w-4 h-4" />}
            loading={filtersLoading}
            searchable
          />
        </FilterGroup>

        {/* Action Button */}
        {(provaSelecionada || temaSelecionado) && (
          <div className="flex justify-center">
            <Link
              to={`/simulado?${provaSelecionada ? `ano=${provaSelecionada}` : ''}${
                provaSelecionada && temaSelecionado ? '&' : ''
              }${temaSelecionado ? `tema=${temaSelecionado}` : ''}`}
              className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
            >
              <PlayIcon className="w-6 h-6" />
              Iniciar Simulado
              {provaSelecionada && ` - ENEM ${provaSelecionada}`}
            </Link>
          </div>
        )}

        {/* Questões em Destaque */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
              Questões em Destaque
            </h2>
            <Link 
              to="/simulado" 
              className="btn-secondary"
            >
              Ver Todas
            </Link>
          </div>

          <QuestionGrid 
            questions={questoesDestaque}
            className="fade-in"
          />
        </section>

        {/* Charts Section */}
        {resumo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Pizza */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-400" />
                Distribuição de Respostas
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-green-400" />
                Estatísticas Gerais
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
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
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#barGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Pontos Fortes e Fracos */}
        {resumo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pontos Fortes */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5" />
                Pontos Fortes
              </h3>
              <div className="space-y-3">
                {resumo.pontosFortes.map((ponto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-slate-200">{ponto}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pontos a Melhorar */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5" />
                Pontos a Melhorar
              </h3>
              <div className="space-y-3">
                {resumo.pontosFracos.map((ponto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-slate-200">{ponto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}