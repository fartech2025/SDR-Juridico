import React, { useState, useEffect } from 'react';
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

interface ResultadoSimulado {
  id_prova: number;
  percentual_acertos: number;
  data_conclusao: string;
}

export default function SimuladosPage() {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<SimuladoDoEnem[]>([]);
  const [resultados, setResultados] = useState<Map<number, ResultadoSimulado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [filtro, setFiltro] = useState<'todos' | 'nao-respondidos' | 'respondidos'>('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      // Buscar usuário
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setErro('Usuário não autenticado');
        return;
      }

      const perfil = await ensureUsuarioRegistro(userData.user);
      setUsuario(perfil);

      // ✅ NOVO: Buscar simulados via SimuladosService (baseado em provas)
      const simuladosData = await SimuladosService.listarSimulados();
      setSimulados(simuladosData);

      // Buscar resultados do usuário
      const { data: resultadosData, error: erroResultados } = await supabase
        .from('resultados_simulados')
        .select('id_simulado, percentual_acertos, data_conclusao')
        .eq('id_usuario', perfil.id_usuario);

      if (!erroResultados) {
        const mapaResultados = new Map();
        resultadosData?.forEach((r) => {
          mapaResultados.set(r.id_simulado, r);
        });
        setResultados(mapaResultados);
      }
    } catch (err) {
      console.error('Erro ao carregar simulados:', err);
      setErro('Erro ao carregar simulados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const simuladosFiltrados = simulados.filter((sim) => {
    const temResultado = resultados.has(sim.id_prova);
    if (filtro === 'nao-respondidos') return !temResultado;
    if (filtro === 'respondidos') return temResultado;
    return true;
  });

  const iniciarSimulado = (idProva: number) => {
    navigate(`/resolver-simulado/${idProva}`);
  };

  const formatarData = (data: string) => {
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">Simulados Disponíveis</h1>
          </div>
          <p className="text-slate-400">
            Pratique com simulados completos para melhorar seu desempenho no ENEM
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {(['todos', 'nao-respondidos', 'respondidos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === f
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {f === 'todos' && '📋 Todos'}
              {f === 'nao-respondidos' && '🆕 Não respondidos'}
              {f === 'respondidos' && '✅ Respondidos'}
            </button>
          ))}
        </div>

        {/* Erro */}
        {erro && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            {erro}
          </div>
        )}

        {/* Grid de Simulados */}
        {simuladosFiltrados.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">📭</div>
            <p className="text-slate-400 text-lg">
              {filtro === 'respondidos'
                ? 'Você ainda não respondeu nenhum simulado. Comece agora!'
                : 'Nenhum simulado disponível'}
            </p>
            {filtro === 'respondidos' && (
              <button
                onClick={() => setFiltro('nao-respondidos')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Ver simulados disponíveis
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simuladosFiltrados.map((simulado) => {
              const resultado = resultados.get(simulado.id_prova);
              const percentualCores = resultado
                ? resultado.percentual_acertos >= 70
                  ? 'from-green-500 to-emerald-600'
                  : resultado.percentual_acertos >= 50
                  ? 'from-yellow-500 to-amber-600'
                  : 'from-red-500 to-rose-600'
                : 'from-blue-500 to-purple-600';

              return (
                <div
                  key={simulado.id_prova}
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

                    {/* Info */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full">
                        <BookOpenIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300">
                          {simulado.total_questoes || 0} questões
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full">
                        <ClockIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300">
                          ~{Math.ceil((simulado.total_questoes || 0) * 3)} min
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
                            onClick={() => iniciarSimulado(simulado.id_prova)}
                            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <SparklesIcon className="w-4 h-4" />
                            Refazer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarSimulado(simulado.id_prova)}
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
        )}
      </div>
    </BasePage>
  );
}
