import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';
import { SimuladosService, SimuladoDoEnem } from '../services/simuladosService';
import { ensureUsuarioRegistro } from '../services/supabaseService';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Simulado {
  id_simulado: number;
  nome: string;
  descricao?: string;
  data_criacao: string;
  total_questoes?: number;
}

interface ResultadoSimulado {
  id_simulado: number;
  percentual_acertos: number;
  data_conclusao: string;
}

export default function SimuladosPage() {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<SimuladoDoEnem[]>([]);
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

      const perfil = await ensureUsuarioRegistro(userData.user);
      setUsuario(perfil);

      // Buscar simulados
      const { data: simuladosData, error: erroSimulados } = await supabase
        .from('simulados')
        .select('id_simulado, nome, descricao, data_criacao');

      if (erroSimulados) throw erroSimulados;

      // Contar questões em cada simulado
      const simuladosComContagem = await Promise.all(
        (simuladosData || []).map(async (sim) => {
          const { count } = await supabase
            .from('simulado_questoes')
            .select('*', { count: 'exact', head: true })
            .eq('id_simulado', sim.id_simulado);

          return {
            ...sim,
            total_questoes: count || 0,
          };
        })
      );

      setSimulados(simuladosComContagem);

      // Buscar resultados do usuário
      const { data: resultadosData, error: erroResultados } = await supabase
        .from('resultados_simulados')
        .select('id_simulado, percentual_acertos, data_conclusao')
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

  const simuladosFiltrados = simulados.filter((sim) => {
    const temResultado = resultados.has(sim.id_simulado);
    if (filtro === 'nao-respondidos') return !temResultado;
    if (filtro === 'respondidos') return temResultado;
    return true;
  });

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simuladosFiltrados.map((simulado) => {
              const resultado = resultados.get(simulado.id_simulado);
              const percentualCores = resultado
                ? resultado.percentual_acertos >= 70
                  ? 'from-green-500 to-emerald-600'
                  : resultado.percentual_acertos >= 50
                  ? 'from-yellow-500 to-amber-600'
                  : 'from-red-500 to-rose-600'
                : 'from-blue-500 to-purple-600';

              return (
                <div
                  key={simulado.id_simulado}
                  className="group relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-blue-500/20"
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${percentualCores}`} />

                  {/* Conteúdo */}
                  <div className="relative p-6 space-y-4 h-full flex flex-col">
                    {/* Cabeçalho */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-100 line-clamp-2">
                        {simulado.nome}
                      </h3>
                      {simulado.descricao && (
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {simulado.descricao}
                        </p>
                      )}
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

                    {/* Resultado ou CTA */}
                    <div className="mt-auto pt-4 border-t border-slate-700">
                      {resultado ? (
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-100">
                              {Math.round(resultado.percentual_acertos)}%
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatarData(resultado.data_conclusao)}
                            </div>
                          </div>
                          <button
                            onClick={() => iniciarSimulado(simulado.id_simulado)}
                            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <SparklesIcon className="w-4 h-4" />
                            Refazer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarSimulado(simulado.id_simulado)}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all font-semibold flex items-center justify-center gap-2 group/btn"
                        >
                          <span>Iniciar</span>
                          <ChevronRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {simulados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-slate-700">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">Total de simulados</p>
              <p className="text-2xl font-bold text-slate-100">{simulados.length}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">Respondidos</p>
              <p className="text-2xl font-bold text-green-400">{resultados.size}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">A responder</p>
              <p className="text-2xl font-bold text-blue-400">
                {simulados.length - resultados.size}
              </p>
            </div>
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
