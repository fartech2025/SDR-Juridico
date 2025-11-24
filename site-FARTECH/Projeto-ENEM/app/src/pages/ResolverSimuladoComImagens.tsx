import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimuladoRenderer, type RespostaUsuario } from '../components/QuestaoRenderer';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';
import SidebarPerformance, { type SimuladoSidebarData } from '../components/pages/simulation/SidebarPerformance';
import SidebarInsights from '../components/pages/simulation/SidebarInsights';
import {
  ensureUsuarioRegistro,
  fetchQuestoesPorProvaTema,
  refreshMaterializedViews,
} from '../services/supabaseService';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ResultadoFinal {
  total: number;
  acertos: number;
  percentual: number;
  tempo_total_segundos: number;
}

export default function ResolverSimulado() {
  const { id_simulado } = useParams<{ id_simulado: string }>();
  const navigate = useNavigate();
  const [simuladoId, setSimuladoId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [avisoEstatisticas, setAvisoEstatisticas] = useState<string | null>(null);
  const [tempoInicio, setTempoInicio] = useState<number>(Date.now());
  const [sidebarMetrics, setSidebarMetrics] = useState<SimuladoSidebarData>({
    respondidas: 0,
    total: 0,
    corretas: 0,
    tempoMedio: 0,
  });

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const perfil = await ensureUsuarioRegistro(user);
          setUsuario(perfil);
        }
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    };

    if (id_simulado) {
      setSimuladoId(Number.parseInt(id_simulado, 10));
      setTempoInicio(Date.now());
    }

    void fetchUsuario();
  }, [id_simulado]);

  const handleProgressUpdate = useCallback((metrics: SimuladoSidebarData) => {
    setSidebarMetrics(metrics);
  }, []);

  const handleSimuladoCompleto = async (respostas: RespostaUsuario[]) => {
    if (!usuario || !simuladoId) {
      alert('Usuário não identificado.');
      return;
    }

    if (!respostas.length) {
      alert('Nenhuma resposta registrada.');
      return;
    }

    try {
      setEnviando(true);
      setAvisoEstatisticas(null);

      const { data: questoesData, error: erroQuestoes } = await fetchQuestoesPorProvaTema(simuladoId);
      if (erroQuestoes) {
        throw erroQuestoes;
      }

      const questoes = dataOrEmpty(questoesData);
      const gabarito = new Map<number, { correta: string | null; alternativas: Map<string, number> }>();

      questoes.forEach((questao) => {
        const alternativasMap = new Map<string, number>();
        questao.alternativas.forEach((alt) => alternativasMap.set(alt.letra.toUpperCase(), alt.id_alternativa));
        gabarito.set(questao.id_questao, {
          correta: questao.alternativa_correta,
          alternativas: alternativasMap,
        });
      });

      let totalAcertos = 0;
      const tempoTotalMs = Date.now() - tempoInicio;

      const answeredIds = respostas.map((r) => r.questao_id);

      await supabase
        .from('respostas_usuarios')
        .delete()
        .eq('id_usuario', usuario.id_usuario)
        .in('id_questao', answeredIds);

      const payload = respostas.map((resposta) => {
        const info = gabarito.get(resposta.questao_id);
        const alternativaMarcada = resposta.resposta.toUpperCase();
        const correta = info?.correta
          ? info.correta.toUpperCase() === alternativaMarcada
          : false;

        if (correta) {
          totalAcertos += 1;
        }

        return {
          id_usuario: usuario.id_usuario,
          id_questao: resposta.questao_id,
          id_alternativa: info?.alternativas.get(alternativaMarcada) ?? null,
          alternativa_marcada: alternativaMarcada,
          correta,
          data_resposta: new Date().toISOString(),
          tempo_resposta_ms: resposta.tempoRespostaMs ?? null,
        };
      });

      const { error: erroInsercao } = await supabase.from('respostas_usuarios').insert(payload);
      if (erroInsercao) {
        throw erroInsercao;
      }

      const refreshOk = await refreshMaterializedViews();
      if (!refreshOk) {
        setAvisoEstatisticas('Respostas salvas. As estatísticas podem levar alguns minutos para refletir este simulado.');
      }

      const percentualAcertos = (totalAcertos / respostas.length) * 100;
      setResultado({
        total: respostas.length,
        acertos: totalAcertos,
        percentual: Number(percentualAcertos.toFixed(1)),
        tempo_total_segundos: Math.round(tempoTotalMs / 1000),
      });
    } catch (err) {
      console.error('Erro ao salvar respostas:', err);
      alert('Erro ao salvar respostas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (!simuladoId || !usuario) {
    return (
      <BasePage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl text-blue-400">⏳</div>
            <p className="text-slate-300">Carregando simulado...</p>
          </div>
        </div>
      </BasePage>
    );
  }

  if (resultado) {
    return (
      <BasePage>
        <div className="max-w-3xl mx-auto py-12 space-y-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Voltar
          </button>

          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              {resultado.percentual >= 70 ? (
                <CheckCircleIcon className="w-12 h-12 text-green-400" />
              ) : (
                <XCircleIcon className="w-12 h-12 text-red-400" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Resultado do Simulado</h1>
                <p className="text-slate-400">
                  Você acertou {resultado.acertos} de {resultado.total} questões.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="glass-card p-4">
                <p className="text-sm text-slate-400">Acertos</p>
                <p className="text-2xl font-semibold text-green-400">{resultado.acertos}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-slate-400">Aproveitamento</p>
                <p className="text-2xl font-semibold text-blue-400">
                  {resultado.percentual.toFixed(1)}%
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-slate-400">Tempo total</p>
                <p className="text-2xl font-semibold text-purple-400">
                  {resultado.tempo_total_segundos} s
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate(`/resolver-simulado/${simuladoId}`)}
                className="btn btn-secondary"
              >
                Refazer simulado
              </button>
              <button onClick={() => navigate('/inicio')} className="btn btn-primary">
                Voltar ao início
              </button>
            </div>
          </div>
          {avisoEstatisticas && (
            <p className="text-sm text-amber-300 text-center">{avisoEstatisticas}</p>
          )}
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage fullWidth contentClassName="py-8">
      <div className="w-full px-4 md:px-8 2xl:px-16">
        <div className="grid gap-5 2xl:gap-6 xl:[grid-template-columns:280px_minmax(0,1fr)_280px]">
          <aside className="order-2 xl:order-1 w-full xl:w-auto xl:sticky xl:top-28 self-start">
            <SidebarPerformance data={sidebarMetrics} />
          </aside>

          <div className="order-1 xl:order-2 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm md:text-base"
              >
                <ArrowLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
                Voltar
              </button>
              <span className="text-xs md:text-sm text-slate-400">
                Usuário #{usuario.id_usuario} | Respostas salvas automaticamente
              </span>
            </div>

            <div className="glass-card p-3 md:p-6">
              <SimuladoRenderer
                id_simulado={simuladoId}
                onSimuladoCompleto={handleSimuladoCompleto}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>

            {enviando && (
              <div className="mt-4 text-xs md:text-sm text-blue-300 text-center">
                Salvando suas respostas, aguarde...
              </div>
            )}
            {avisoEstatisticas && (
              <div className="mt-3 text-xs md:text-sm text-amber-300 text-center">
                {avisoEstatisticas}
              </div>
            )}
          </div>

          <aside className="order-3 w-full xl:w-auto xl:sticky xl:top-28 self-start">
            <SidebarInsights data={sidebarMetrics} />
          </aside>
        </div>
      </div>
    </BasePage>
  );
}

function dataOrEmpty<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}
