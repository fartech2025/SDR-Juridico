import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';
import { buscarSimuladosDisponveis } from '../services/questoesService';
import { ensureUsuarioRegistro } from '../services/supabaseService';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type Simulado = {
  id_simulado: number;
  id_prova: number;
  nome: string;
  descricao?: string | null;
  data_criacao: string;
  total_questoes: number;
  tempo_por_questao?: number | null;
};

type ResultadoSimulado = {
  id_prova: number;
  total_respondidas: number;
  total_acertos: number;
  percentual: number;
};

export default function SimuladosPage() {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [resultados, setResultados] = useState<Map<number, ResultadoSimulado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'nao-respondidos' | 'respondidos'>('todos');

  useEffect(() => {
    void carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setErro('Usuário não autenticado');
        return;
      }

      const perfil = await ensureUsuarioRegistro(user);
      setUsuarioId(perfil.id_usuario);

      const simuladosDisponiveis = await buscarSimuladosDisponveis();
      const simuladosFormatados: Simulado[] = simuladosDisponiveis.map((sim) => ({
        id_simulado: sim.id_simulado,
        id_prova: sim.id_prova,
        nome: sim.nome,
        descricao: sim.descricao,
        data_criacao: sim.data_criacao,
        total_questoes: sim.total_questoes,
        tempo_por_questao: sim.tempo_por_questao,
      }));

      setSimulados(simuladosFormatados);

      const { data: respostasData, error: erroRespostas } = await supabase
        .from('respostas_usuarios')
        .select('id_questao, correta, questoes:questoes(id_prova)')
        .eq('id_usuario', perfil.id_usuario);

      if (erroRespostas) {
        console.error('Erro ao buscar respostas do usuário:', erroRespostas);
        return;
      }

      const agregados = new Map<number, ResultadoSimulado>();

      (respostasData ?? []).forEach((linha: any) => {
        const idProva = linha.questoes?.id_prova;
        if (!idProva) return;

        const bucket = agregados.get(idProva) ?? {
          id_prova: idProva,
          total_respondidas: 0,
          total_acertos: 0,
          percentual: 0,
        };

        bucket.total_respondidas += 1;
        if (linha.correta) {
          bucket.total_acertos += 1;
        }

        agregados.set(idProva, bucket);
      });

      agregados.forEach((bucket, idProva) => {
        const totalQuestoes = simuladosFormatados.find((s) => s.id_prova === idProva)?.total_questoes ?? 0;
        const percentual = bucket.total_respondidas
          ? (bucket.total_acertos / bucket.total_respondidas) * 100
          : 0;

        agregados.set(idProva, {
          ...bucket,
          percentual: Number(percentual.toFixed(2)),
        });
      });

      setResultados(
        new Map(
          Array.from(agregados.entries()).map(([idProva, resultado]) => [
            idProva,
            resultado,
          ])
        )
      );
    } catch (err) {
      console.error('Erro ao carregar simulados:', err);
      setErro('Erro ao carregar simulados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const simuladosFiltrados = useMemo(() => {
    return simulados.filter((sim) => {
      const temResultado = resultados.has(sim.id_prova);
      if (filtro === 'nao-respondidos') return !temResultado;
      if (filtro === 'respondidos') return temResultado;
      return true;
    });
  }, [simulados, resultados, filtro]);

  const iniciarSimulado = (idProva: number) => {
    navigate(`/resolver-simulado/${idProva}`);
  };

  const formatarData = (data: string) => {
    if (!data) return 'Data não informada';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  if (loading) {
    return (
      <BasePage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-slate-300">Carregando simulados...</p>
          </div>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="ds-heading text-3xl flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-blue-400" />
              Simulados ENEM
            </h1>
            <p className="ds-muted">
              Selecione um simulado baseado nas provas oficiais e acompanhe seu desempenho.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltro('todos')}
              className={`btn ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('nao-respondidos')}
              className={`btn ${filtro === 'nao-respondidos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Não respondidos
            </button>
            <button
              onClick={() => setFiltro('respondidos')}
              className={`btn ${filtro === 'respondidos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Respondidos
            </button>
          </div>
        </header>

        {erro && (
          <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </div>
        )}

        {!erro && simuladosFiltrados.length === 0 && (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="text-5xl">📚</div>
            <p className="text-slate-300">
              {filtro === 'respondidos'
                ? 'Você ainda não respondeu nenhum simulado. Comece agora!'
                : 'Nenhum simulado disponível'}
            </p>
            {filtro === 'respondidos' && (
              <button
                onClick={() => setFiltro('nao-respondidos')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Ver simulados disponíveis
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simuladosFiltrados.map((simulado) => {
            const resultado = resultados.get(simulado.id_prova);
            const progresso = resultado
              ? Math.min(100, (resultado.total_respondidas / simulado.total_questoes) * 100 || 0)
              : 0;

            return (
              <div key={simulado.id_simulado} className="glass-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BookOpenIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h2 className="text-xl font-semibold text-slate-100">
                      {simulado.nome}
                    </h2>
                    {simulado.descricao && (
                      <p className="text-sm text-slate-400">{simulado.descricao}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Criado em {formatarData(simulado.data_criacao)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span>{simulado.total_questoes} questões</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <ClockIcon className="w-5 h-5 text-yellow-400" />
                    <span>
                      {simulado.tempo_por_questao
                        ? `${simulado.tempo_por_questao} seg/questão`
                        : 'Tempo livre'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Seu progresso</span>
                    <span>{progresso.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  {resultado && (
                    <div className="text-sm text-slate-300 flex justify-between">
                      <span>
                        Respondidas: {resultado.total_respondidas}/{simulado.total_questoes}
                      </span>
                      <span>Aproveitamento: {resultado.percentual.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => iniciarSimulado(simulado.id_simulado)}
                    className="flex-1 inline-flex items-center justify-center gap-2 btn btn-primary"
                  >
                    Iniciar
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  {resultado && (
                    <Link
                      to={`/provas/${simulado.id_simulado}`}
                      className="btn btn-secondary flex-1 text-center"
                    >
                      Revisar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="glass-card p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-blue-300" />
            <span className="text-slate-300">
              {usuarioId
                ? `Resultados vinculados ao usuário #${usuarioId}.`
                : 'Acesse sua conta para salvar o progresso.'}
            </span>
          </div>
          <Link to="/dashboard" className="btn btn-secondary inline-flex items-center gap-2">
            <ChartIcon />
            Ver estatísticas
          </Link>
        </footer>
      </div>
    </BasePage>
  );
}

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5l6 6 8.25-13.5"
      />
    </svg>
  );
}
