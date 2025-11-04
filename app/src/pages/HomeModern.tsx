import React, { useEffect, useState } from 'react'
import { UsuarioResumo, Prova, Tema } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { supabase } from '@/lib/supabaseClient'
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
};

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
        



        // Buscar dados reais do usuário (ID demo: 0)
        const usuarioId = 0;
        console.log('👤 Buscando dados do usuário ID:', usuarioId)
        const { data: dadosUsuario, error: errorUsuario } = await supabase
          .from('resumo_usuarios')
          .select('*')
          .eq('id_usuario', usuarioId)
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
          .select('id_prova, provas(ano)')
          .not('id_prova', 'is', null)

        if (questoesError) {
          console.error('❌ Erro ao buscar questões:', questoesError)
          setProvas(demoProvas)
        } else {
          console.log('✅ Questões encontradas:', questoesData)
          // Agrupar por ano e contar
          const anosCount = questoesData.reduce((acc: Record<number, number>, item: any) => {
            const ano = item.provas?.ano
            if (!ano) return acc
            acc[ano] = (acc[ano] || 0) + 1
            return acc
          }, {})
          
          const provasFormatadas: Prova[] = Object.entries(anosCount)
            .map(([ano, count]) => ({
              id_prova: parseInt(ano),
              ano: parseInt(ano),
              descricao: `ENEM ${ano} - ${count} questões`
            }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-7xl px-4 py-8">
        <div className="glass-card p-8 mt-8">
          <h1 className="ds-heading flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-blue-400" />
            Dashboard ENEM
          </h1>
          <p className="ds-muted mb-8">Bem-vindo de volta, {resumo?.nome || 'Estudante'}!</p>
          {/* ...restante do conteúdo da HomeModern, já refatorado para o padrão central... */}
        </div>
      </div>
    </div>
  );
}
