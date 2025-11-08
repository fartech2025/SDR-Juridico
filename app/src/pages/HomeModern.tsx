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
  pontosFortes: ['Literatura', 'InterpretaÃ§Ã£o de texto', 'GramÃ¡tica'],
  pontosFracos: ['MatemÃ¡tica', 'FÃ­sica', 'QuÃ­mica']
};

const demoProvas: Prova[] = [
  { id_prova: 1, ano: 2024, descricao: 'Simulado ENEM 2024 - Linguagens' },
  { id_prova: 2, ano: 2023, descricao: 'Simulado ENEM 2023 - Linguagens' }
]

const demoTemas: Tema[] = [
  { id_tema: 1, nome_tema: 'Literatura' },
  { id_tema: 2, nome_tema: 'InterpretaÃ§Ã£o de texto' },
  { id_tema: 3, nome_tema: 'GramÃ¡tica' }
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
        console.log('ðŸ”„ Carregando dados reais do Supabase...')
        



        // Buscar dados reais do usuÃ¡rio (ID demo: 0)
        const usuarioId = 0;
        console.log('ðŸ‘¤ Buscando dados do usuÃ¡rio ID:', usuarioId)
        setResumo(demoResumo)
        // Buscar anos únicos das questões
        console.log('ðŸ“š Buscando anos disponÃ­veis...')
        setFiltersLoading(true)
        
        const { data: questoesData, error: questoesError } = await supabase
          .from('questoes')
          .select('id_prova, provas(ano)')
          .not('id_prova', 'is', null)

        if (questoesError) {
          console.error('âŒ Erro ao buscar questÃµes:', questoesError)
          setProvas(demoProvas)
        } else {
          console.log('âœ… QuestÃµes encontradas:', questoesData)
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
              descricao: `ENEM ${ano} - ${count} questÃµes`
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
          {/* ...restante do conteÃºdo da HomeModern, jÃ¡ refatorado para o padrÃ£o central... */}
        </div>
      </div>
    </div>
  );
}



