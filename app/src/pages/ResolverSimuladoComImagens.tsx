import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimuladoRenderer } from '../components/QuestaoRenderer';
import BasePage from '../components/BasePage';
import { supabase } from '../lib/supabaseClient';
import { ensureUsuarioRegistro } from '../services/supabaseService';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface RespostaUsuario {
  questao_id: number;
  resposta: string;
  timestamp: number;
}

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
  const [tempo_inicio, setTempoInicio] = useState<number>(Date.now());

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const perfil = await ensureUsuarioRegistro(user);
          setUsuario(perfil);
        }
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    };

    if (id_simulado) {
      setSimuladoId(parseInt(id_simulado, 10));
      setTempoInicio(Date.now());
    }

    fetchUsuario();
  }, [id_simulado]);

  const handleSimuladoCompleto = async (respostas: RespostaUsuario[]) => {
    if (!usuario) {
      alert('Usuário não identificado');
      return;
    }

    try {
      setEnviando(true);

      // Buscar gabarito das questões
      const questoesIds = respostas.map((r) => r.questao_id);
      const { data: questoes } = await supabase
        .from('questoes')
        .select('id_questao, resposta_correta')
        .in('id_questao', questoesIds);

      if (!questoes) throw new Error('Erro ao buscar gabarito');

      // Calcular acertos e tempo
      let totalAcertos = 0;
      const tempo_total_ms = Date.now() - tempo_inicio;
      
      const respostasParaInserir = respostas.map((resposta) => {
        const questao = questoes.find((q: any) => q.id_questao === resposta.questao_id);
        const correta = questao?.resposta_correta === resposta.resposta;
        if (correta) totalAcertos++;

        return {
          id_usuario: usuario.id_usuario,
          id_questao: resposta.questao_id,
          resposta_usuario: resposta.resposta,
          correta,
          tempo_resposta_ms: resposta.timestamp,
          data_resposta: new Date().toISOString(),
        };
      });

      // Inserir respostas no banco
      const { error: erroInsert } = await supabase
        .from('respostas_usuarios')
        .insert(respostasParaInserir);

      if (erroInsert) throw erroInsert;

      // Salvar resultado do simulado
      const percentualAcertos = (totalAcertos / respostas.length) * 100;
      
      await supabase
        .from('resultados_simulados')
        .upsert({
          id_usuario: usuario.id_usuario,
          id_simulado: simuladoId,
          percentual_acertos: percentualAcertos,
          tempo_total_ms,
          data_conclusao: new Date().toISOString(),
          total_questoes: respostas.length,
          total_acertos: totalAcertos,
        }, { onConflict: 'id_usuario,id_simulado' });

      // Mostrar resultado
      setResultado({
        total: respostas.length,
        acertos: totalAcertos,
        percentual: Math.round(percentualAcertos),
        tempo_total_segundos: Math.round(tempo_total_ms / 1000),
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
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-slate-300">Carregando simulado...</p>
          </div>
        </div>
      </BasePage>
    );
  }

  // Tela de resultado final
  if (resultado) {
    const percentualCores = resultado.percentual >= 70
      ? 'from-green-500 to-emerald-600'
      : resultado.percentual >= 50
      ? 'from-yellow-500 to-amber-600'
      : 'from-red-500 to-rose-600';

    return (
      <BasePage>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/simulados')}
            className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar aos simulados
          </button>

          <div className={`rounded-2xl border-2 border-gradient bg-gradient-to-br ${percentualCores} p-1`}>
            <div className="bg-slate-900 rounded-xl p-8 md:p-12 space-y-8 text-center">
              {/* Ícone de resultado */}
              <div className="flex justify-center">
                {resultado.percentual >= 70 ? (
                  <CheckCircleIcon className="w-24 h-24 text-green-400" />
                ) : resultado.percentual >= 50 ? (
                  <div className="w-24 h-24 text-amber-400 text-5xl">⚠️</div>
                ) : (
                  <XCircleIcon className="w-24 h-24 text-red-400" />
                )}
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-100">
                  {resultado.percentual >= 70
                    ? 'Excelente!'
                    : resultado.percentual >= 50
                    ? 'Bom desempenho!'
                    : 'Continue praticando!'}
                </h2>
                <p className="text-slate-400 text-lg">
                  {resultado.percentual >= 70
                    ? 'Você está no caminho certo para o ENEM!'
                    : resultado.percentual >= 50
                    ? 'Você tem potencial, continue estudando!'
                    : 'Não desista! Revise os conteúdos e tente novamente.'}
                </p>
              </div>

              {/* Resultado principal */}
              <div className="bg-slate-800/50 rounded-xl p-8 space-y-6 border border-slate-700">
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">Sua pontuação</p>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {resultado.percentual}%
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs">Acertos</p>
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.acertos}/{resultado.total}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs">Erros</p>
                    <p className="text-2xl font-bold text-red-400">
                      {resultado.total - resultado.acertos}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs">Tempo total</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {Math.floor(resultado.tempo_total_segundos / 60)}m {resultado.tempo_total_segundos % 60}s
                    </p>
                  </div>
                </div>
              </div>

              {/* Recomendações */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 text-left space-y-2">
                <p className="text-slate-300 font-semibold">📋 Próximos passos:</p>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {resultado.percentual >= 70 ? (
                    <>
                      <li>✅ Continue com simulados mais desafiadores</li>
                      <li>✅ Estude tópicos específicos com imagens</li>
                      <li>✅ Pratique questões semelhantes</li>
                    </>
                  ) : resultado.percentual >= 50 ? (
                    <>
                      <li>📚 Revise os temas onde teve dificuldade</li>
                      <li>🔄 Refaça este simulado em uma semana</li>
                      <li>📝 Estude com mais foco</li>
                    </>
                  ) : (
                    <>
                      <li>📖 Estude a matéria teórica com atenção</li>
                      <li>🎯 Comece com questões mais fáceis</li>
                      <li>💪 Não desista, persista no estudo</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Botões */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/simulados')}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors font-semibold"
                >
                  Ver outros simulados
                </button>
                <button
                  onClick={() => {
                    setResultado(null);
                    window.location.reload();
                  }}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-semibold"
                >
                  Refazer simulado
                </button>
              </div>
            </div>
          </div>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/simulados')}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar
        </button>

        {simuladoId && (
          <SimuladoRenderer
            id_simulado={simuladoId}
            onSimuladoCompleto={handleSimuladoCompleto}
          />
        )}

        {enviando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900 p-8 rounded-lg space-y-4 text-center border border-slate-700">
              <div className="animate-spin text-4xl">⏳</div>
              <p className="text-slate-100 font-semibold">Salvando suas respostas...</p>
              <p className="text-slate-400 text-sm">Não feche esta página</p>
            </div>
          </div>
        )}
      </div>
    </BasePage>
  );
}
