import React, { useEffect, useState } from 'react'
import { UsuarioResumo, Prova, Tema } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { hasSupabase, supabase, CURRENT_USER_ID } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'

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

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [provas, setProvas] = useState<Prova[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Carregando dados reais do Supabase...')
        console.log('🔧 hasSupabase:', hasSupabase)
        console.log('🔧 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('🔧 VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '***definida***' : 'indefinida')
        
        if (!hasSupabase) {
          throw new Error('Supabase não configurado - verifique as variáveis de ambiente')
        }        // Buscar dados reais do usuário
        console.log('👤 Buscando dados do usuário ID:', CURRENT_USER_ID)
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('id_usuario, nome')
          .eq('id_usuario', CURRENT_USER_ID)
          .limit(1)

        if (userError || !userData || userData.length === 0) {
          console.error('❌ Erro ao buscar usuário:', userError)
          console.log('🔧 Criando usuário padrão...')
          
          // Tentar criar usuário padrão se não existir
          const { data: newUser, error: createError } = await supabase
            .from('usuarios')
            .insert([{ 
              id_usuario: CURRENT_USER_ID, 
              nome: 'Usuário Demo',
              email: 'demo@exemplo.com'
            }])
            .select('id_usuario, nome')

          if (createError) {
            console.error('❌ Erro ao criar usuário:', createError)
            // Usar dados padrão sem falhar
            const defaultUser = { id_usuario: CURRENT_USER_ID, nome: 'Usuário Demo' }
            console.log('✅ Usando usuário padrão:', defaultUser.nome)
          } else {
            console.log('✅ Usuário criado:', newUser?.[0]?.nome)
          }
        } else {
          console.log('✅ Usuário encontrado:', userData[0].nome)
        }

        const finalUserData = userData?.[0] || { id_usuario: CURRENT_USER_ID, nome: 'Usuário Demo' }

        // Buscar estatísticas do usuário
        console.log('📊 Buscando estatísticas do usuário...')
        const { data: statsData, error: statsError } = await supabase
          .from('resultados_usuarios')
          .select('*')
          .eq('id_usuario', CURRENT_USER_ID)
          .single()

        if (statsError) {
          console.log('⚠️ Usuário sem estatísticas registradas, iniciando perfil...')
          // Criar estatísticas iniciais se não existir
          setResumo({
            id_usuario: finalUserData.id_usuario,
            nome: finalUserData.nome,
            total_questoes: 0,
            total_acertos: 0,
            total_erros: 0,
            percentual_acertos: 0,
            tempo_medio_resposta_ms: 0,
            pontosFortes: ['Comece respondendo questões!'],
            pontosFracos: ['Faça sua primeira prova']
          })
        } else {
          console.log('✅ Estatísticas encontradas:', statsData)
          
          // Buscar pontos fortes e fracos reais baseados nos temas
          console.log('🎯 Buscando performance por temas...')
          const { data: temaData } = await supabase
            .from('resultados_por_tema')
            .select('nome_tema, percentual_acertos')
            .eq('id_usuario', CURRENT_USER_ID)
            .order('percentual_acertos', { ascending: false })

          console.log('📈 Performance por temas:', temaData?.length || 0, 'temas encontrados')

          const pontosFortes = (temaData?.slice(0, 3) || []).map((t: any) => t.nome_tema || 'Tema desconhecido')
          const pontosFracos = (temaData?.slice(-3) || []).map((t: any) => t.nome_tema || 'Tema desconhecido')

          setResumo({
            id_usuario: finalUserData.id_usuario,
            nome: finalUserData.nome,
            total_questoes: statsData.total_questoes || 0,
            total_acertos: statsData.total_acertos || 0,
            total_erros: (statsData.total_questoes || 0) - (statsData.total_acertos || 0),
            percentual_acertos: statsData.percentual_acertos || 0,
            tempo_medio_resposta_ms: 145000, // Valor padrão
            pontosFortes: pontosFortes.length ? pontosFortes : ['Continue praticando!'],
            pontosFracos: pontosFracos.length ? pontosFracos : ['Explore novos temas']
          })
        }

        // Carregar provas e temas diretamente do banco de dados
        console.log('📚 Carregando provas e temas do banco de dados...')
        
        // Buscar todas as provas disponíveis
        const { data: provasData, error: provasError } = await supabase
          .from('provas')
          .select('id_prova, ano, descricao')
          .order('ano', { ascending: false })

        if (provasError) {
          console.error('Erro ao carregar provas:', provasError)
          throw new Error(`Erro ao carregar provas: ${provasError.message}`)
        } else {
          console.log('✅ Provas carregadas:', provasData?.length || 0)
          console.log('📋 Lista de provas:', provasData?.map(p => `${p.ano} (ID: ${p.id_prova})`))
          setProvas(provasData || [])
        }

        // Buscar todos os temas disponíveis
        const { data: temasData, error: temasError } = await supabase
          .from('temas')
          .select('id_tema, nome_tema')
          .order('nome_tema', { ascending: true })

        if (temasError) {
          console.error('Erro ao carregar temas:', temasError)
          throw new Error(`Erro ao carregar temas: ${temasError.message}`)
        } else {
          console.log('✅ Temas carregados:', temasData?.length || 0)
          console.log('🏷️ Lista de temas:', temasData?.slice(0, 5).map(t => `${t.nome_tema} (ID: ${t.id_tema})`))
          setTemas(temasData || [])
        }

        // Verificar se existem questões para cada prova
        if (provasData?.length) {
          const { data: questoesCount } = await supabase
            .from('questoes')
            .select('id_prova', { count: 'exact' })
            .in('id_prova', provasData.map((p: any) => p.id_prova))

          console.log('Total de questões disponíveis:', questoesCount || 0)
        }

        // Atualizar estados com dados reais
        setProvas(provasData || [])
        setTemas(temasData || [])
        
        console.log('✅ Carregamento concluído!')
        console.log('📊 Resumo final:')
        console.log('  - Provas disponíveis:', provasData?.length || 0)
        console.log('  - Temas disponíveis:', temasData?.length || 0)
        
      } catch (e: any) {
        console.error('❌ Erro crítico ao carregar dados reais:', e)
        setError(`Erro de conexão: ${e.message}`)
        
        // Não usar dados demo - deixar vazios e mostrar erro
        setResumo({
          id_usuario: 0,
          nome: 'Erro de Conexão',
          total_questoes: 0,
          total_acertos: 0,
          total_erros: 0,
          percentual_acertos: 0,
          tempo_medio_resposta_ms: 0,
          pontosFortes: ['Erro ao carregar'],
          pontosFracos: ['Verifique conexão']
        })
        
        setProvas([])
        setTemas([])
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

        {/* Indicador de Status dos Dados */}
        {error ? (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">
                Usando dados de demonstração - Erro de conexão com o banco de dados
              </span>
            </div>
          </div>
        ) : hasSupabase ? (
          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-200">
              <span className="text-xl">✅</span>
              <span className="font-medium">
                Conectado ao banco de dados - Dados atualizados ({provas.length} provas, {temas.length} temas)
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-200">
              <span className="text-xl">🔧</span>
              <span className="font-medium">
                Modo demonstração - Configure o Supabase para dados reais
              </span>
            </div>
          </div>
        )}

        {/* Debug Info - apenas durante desenvolvimento */}
        {import.meta.env.DEV && (
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
            <h3 className="text-yellow-200 font-medium mb-2">🔧 Debug Info:</h3>
            <div className="text-sm text-yellow-100 space-y-1">
              <p>hasSupabase: {hasSupabase ? '✅' : '❌'}</p>
              <p>Provas carregadas: {provas.length}</p>
              <p>Temas carregados: {temas.length}</p>
              <p>Prova selecionada: {provaSelecionada || 'nenhuma'}</p>
              <p>Tema selecionado: {temaSelecionado || 'nenhum'}</p>
              <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</p>
              <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
            </div>
          </div>
        )}

        {/* Seleção de Provas - Posição Destacada */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📚</span>
            Escolher Prova para Estudar
          </h2>
          
          {/* Filtros lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Filtro por Ano/Prova */}
            <div className="space-y-3">
              <label className="text-blue-200 text-base font-medium flex items-center gap-2">
                <span className="text-xl">📅</span>
                Filtrar por Ano:
              </label>
              <select 
                onChange={(e) => {
                  console.log('🔧 Prova selecionada:', e.target.value);
                  setProvaSelecionada(e.target.value);
                }} 
                className="w-full p-4 rounded-xl bg-white/10 border border-blue-300/30 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 text-base"
                value={provaSelecionada}
                aria-label="Selecionar prova por ano"
              >
                <option value="" className="bg-slate-800 text-white">🎯 Todos os anos</option>
                {provas.map((p) => (
                  <option key={p.id_prova} value={p.id_prova} className="bg-slate-800 text-white">
                    📝 ENEM {p.ano} {p.descricao ? `- ${p.descricao}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Tema */}
            <div className="space-y-3">
              <label className="text-purple-200 text-base font-medium flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                Filtrar por Tema:
              </label>
              <select 
                onChange={(e) => {
                  console.log('🔧 Tema selecionado:', e.target.value);
                  setTemaSelecionado(e.target.value);
                }} 
                className="w-full p-4 rounded-xl bg-white/10 border border-purple-300/30 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 text-base"
                value={temaSelecionado}
                aria-label="Selecionar tema"
              >
                <option value="" className="bg-slate-800 text-white">🎯 Todos os temas</option>
                {temas.map((t) => (
                  <option key={t.id_tema} value={t.id_tema} className="bg-slate-800 text-white">
                    🏷️ {t.nome_tema}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Opções de Estudo:
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Prova Completa */}
              {provaSelecionada ? (
                <Link 
                  to={`/simulado/${provaSelecionada}/completa`}
                  onClick={() => console.log('🔗 Navegando para prova completa:', `/simulado/${provaSelecionada}/completa`)} 
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 p-5 rounded-xl font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  tabIndex={0}
                  aria-label="Prova completa do ano selecionado"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    📋 Prova Completa {provas.find(p => p.id_prova.toString() === provaSelecionada)?.ano || ''}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
              ) : (
                <button 
                  disabled
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 p-5 rounded-xl font-bold text-gray-400 shadow-lg opacity-50 cursor-not-allowed"
                  aria-label="Selecione um ano primeiro"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    📋 Selecione um Ano Primeiro
                  </span>
                </button>
              )}

              {/* Estudar por Tema */}
              {provaSelecionada && temaSelecionado ? (
                <Link 
                  to={`/simulado/${provaSelecionada}/${temaSelecionado}`}
                  onClick={() => console.log('🔗 Navegando para tema específico:', `/simulado/${provaSelecionada}/${temaSelecionado}`)} 
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 p-5 rounded-xl font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  tabIndex={0}
                  aria-label="Estudar tema específico"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    🏷️ {temas.find(t => t.id_tema.toString() === temaSelecionado)?.nome_tema || 'Tema Selecionado'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
              ) : (
                <button 
                  disabled
                  className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 p-5 rounded-xl font-bold text-gray-400 shadow-lg opacity-50 cursor-not-allowed"
                  aria-label="Selecione ano e tema primeiro"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    🏷️ Selecione Ano + Tema
                  </span>
                </button>
              )}

              {/* Ranking */}
              <Link 
                to="/ranking" 
                className="group relative overflow-hidden bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 p-5 rounded-xl font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                tabIndex={0}
                aria-label="Ver ranking"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                  🏆 Ver Ranking
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Link>
            </div>

            {/* Informação sobre seleção */}
            {(provaSelecionada || temaSelecionado) && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-200">
                  <span className="text-xl">ℹ️</span>
                  <span className="font-medium">
                    Filtros ativos: 
                    {provaSelecionada && ` Ano ${provas.find(p => p.id_prova.toString() === provaSelecionada)?.ano}`}
                    {provaSelecionada && temaSelecionado && ' + '}
                    {temaSelecionado && ` ${temas.find(t => t.id_tema.toString() === temaSelecionado)?.nome_tema}`}
                  </span>
                </div>
                {provaSelecionada && (
                  <div className="mt-2 text-sm text-blue-300">
                    ✅ Prova Completa disponível
                  </div>
                )}
                {provaSelecionada && temaSelecionado && (
                  <div className="mt-1 text-sm text-purple-300">
                    ✅ Estudo por Tema disponível
                  </div>
                )}
              </div>
            )}

            {/* Instruções quando não há seleção */}
            {!provaSelecionada && !temaSelecionado && (
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-200">
                  <span className="text-xl">💡</span>
                  <span className="font-medium">
                    Selecione um ano e/ou tema acima para começar a estudar!
                  </span>
                </div>
              </div>
            )}
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
