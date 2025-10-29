import React, { useEffect, useState } from 'react'
import { UsuarioResumo, Prova, Tema } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { hasSupabase, supabase, CURRENT_USER_ID } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import ChatGPTStyleSidebar from '@/components/ui/ChatGPTStyleSidebar'

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
  { id_prova: 1, descricao: 'ENEM 2023 - 1º Dia', ano: 2023 },
  { id_prova: 2, descricao: 'ENEM 2023 - 2º Dia', ano: 2023 },
]

const demoTemas: Tema[] = [
  { id_tema: 1, nome_tema: 'Literatura' },
  { id_tema: 2, nome_tema: 'Matemática' },
]

export default function Home() {
  const [resumo, setResumo] = useState<UsuarioResumo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [provas, setProvas] = useState<Prova[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [provaSelecionada, setProvaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState('')
  const [aproveitamentoPorTema, setAproveitamentoPorTema] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        if (!hasSupabase) {
          // Usar dados demo se não houver Supabase
          setResumo(demoResumo)
          setProvas(demoProvas)
          setTemas(demoTemas)
          setAproveitamentoPorTema([
            { tema: 'Literatura', acertos: 85, total: 100 },
            { tema: 'Matemática', acertos: 65, total: 100 }
          ])
          return
        }

        // Carregar resumo do usuário
        const { data: ru, error: e1 } = await supabase!
          .from('resultados_usuarios')
          .select('id_usuario,total_questoes,total_acertos,total_erros,percentual_acertos,tempo_medio_resposta_ms')
          .eq('id_usuario', CURRENT_USER_ID)
          .maybeSingle()
        if (e1) throw e1

        // Carregar dados do usuário
        const { data: u, error: e4 } = await supabase!
          .from('usuarios')
          .select('id_usuario,nome')
          .eq('id_usuario', CURRENT_USER_ID)
          .maybeSingle()
        if (e4) throw e4

        // Carregar provas
        const { data: provasData, error: e5 } = await supabase!
          .from('provas')
          .select('id_prova,descricao,ano')
        if (e5) throw e5

        // Carregar temas
        const { data: temasData, error: e6 } = await supabase!
          .from('temas')
          .select('id_tema,nome_tema')
        if (e6) throw e6

        // Carregar resultados por tema
        const { data: rpt, error: e2 } = await supabase!
          .from('resultados_por_tema')
          .select('id_tema,percentual')
          .eq('id_usuario', CURRENT_USER_ID)
        if (e2) throw e2

        const ids = Array.from(new Set((rpt ?? []).map(r => r.id_tema)))
        let nomes = new Map<number, string>()
        
        if (temasData) {
          temasData.forEach(t => nomes.set(t.id_tema, t.nome_tema))
        }

        const fortes = (rpt ?? []).filter(r => (r.percentual ?? 0) >= 70).map(r => nomes.get(r.id_tema) || `Tema ${r.id_tema}`).slice(0,5)
        const fracos = (rpt ?? []).filter(r => (r.percentual ?? 0) <= 40).map(r => nomes.get(r.id_tema) || `Tema ${r.id_tema}`).slice(0,5)

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

        setProvas(provasData || [])
        setTemas(temasData || [])
        
        // Transformar dados para aproveitamento por tema
        const aproveitamento = (rpt ?? []).map(r => ({
          tema: nomes.get(r.id_tema) || `Tema ${r.id_tema}`,
          acertos: Math.round((r.percentual || 0)),
          total: 100
        }))
        setAproveitamentoPorTema(aproveitamento)

      } catch (e: any) {
        console.error('Erro ao carregar dados:', e)
        setError(e.message || 'Erro ao carregar resumo')
        // Fallback para dados demo em caso de erro
        setResumo(demoResumo)
        setProvas(demoProvas)
        setTemas(demoTemas)
        setAproveitamentoPorTema([
          { tema: 'Literatura', acertos: 85, total: 100 },
          { tema: 'Matemática', acertos: 65, total: 100 }
        ])
      }
    })()
  }, [])

  const chartData = resumo ? [
    { name: 'Acertos', value: resumo.total_acertos },
    { name: 'Erros', value: resumo.total_erros }
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar ChatGPT Style */}
      <ChatGPTStyleSidebar
        provas={provas}
        temas={temas}
        provaSelecionada={provaSelecionada}
        temaSelecionado={temaSelecionado}
        onProvaChange={setProvaSelecionada}
        onTemaChange={setTemaSelecionado}
        aproveitamentoPorTema={aproveitamentoPorTema}
      />

      {/* Main Content */}
      <div style={{ marginLeft: '280px', padding: '24px', minHeight: '100vh' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Moderno */}
          <div className="glass-card p-6 backdrop-blur-xl">
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

          {/* Status de Conexão */}
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
                  Conectado ao banco de dados - Dados atualizados
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

          {/* Cards de Estatísticas */}
          {resumo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Questões</p>
                    <p className="text-2xl font-bold text-white">{resumo.total_questoes}</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Acertos</p>
                    <p className="text-2xl font-bold text-white">{resumo.total_acertos}</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Erros</p>
                    <p className="text-2xl font-bold text-white">{resumo.total_erros}</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Tempo/Questão</p>
                    <p className="text-2xl font-bold text-white">{Math.round(resumo.tempo_medio_resposta_ms/1000)}s</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}