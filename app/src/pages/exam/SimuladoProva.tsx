import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ensureUsuarioRegistro, fetchQuestoesPorProvaTema } from '../../services/supabaseService';
import type { Questao } from '../../types';

export default function SimuladoProva() {
  const { id_prova, id_tema } = useParams();
  const navigate = useNavigate();
  
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [resumo, setResumo] = useState<{ total: number; acertos: number; erros: number; percentual: number }>({
    total: 0,
    acertos: 0,
    erros: 0,
    percentual: 0,
  });

  const totalRespondidas = useMemo(
    () => Object.values(respostas).filter(Boolean).length,
    [respostas]
  );

  const questao = questoes[questaoAtual] ?? null;

  useEffect(() => {
    const carregar = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user) {
          const perfil = await ensureUsuarioRegistro(user);
          setUsuarioId(perfil.id_usuario);
        }
      } catch (authError) {
        console.error('Não foi possível carregar usuário autenticado', authError);
      }
    };
    carregar();
  }, []);

  useEffect(() => {
    async function carregarQuestoes() {
      try {
        const provaId = Number(id_prova);
        if (!Number.isFinite(provaId) || provaId <= 0) {
          setErro('Prova selecionada é inválida.');
          setQuestoes([]);
          setLoading(false);
          return;
        }
        const temaId = id_tema === 'completa' ? undefined : Number(id_tema);
        const normalizedTemaId =
          temaId !== undefined && Number.isFinite(temaId) && temaId > 0 ? temaId : undefined;

        const { data, error } = await fetchQuestoesPorProvaTema(provaId, normalizedTemaId);
        if (error) {
          console.error('Erro ao carregar questões:', error);
          setErro('Não foi possível carregar as questões deste simulado.');
          setQuestoes([]);
        } else {
          setQuestoes(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setErro('Erro inesperado ao carregar questões.');
        setQuestoes([]);
      } finally {
        setLoading(false);
      }
    }
    carregarQuestoes();
  }, [id_prova, id_tema]);

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual((prev) => prev + 1);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4" aria-label="Carregando"></span>
          <p className="text-gray-400">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-blue-400">🎓 Simulado ENEM</h1>
          <div className="bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl">
            <p className="text-red-400 mb-4">{erro}</p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-blue-400">🎓 Simulado ENEM</h1>
          <div className="bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl">
            <p className="text-gray-400 mb-4">
              Nenhuma questão encontrada para esta prova/tema.<br/>
              <span className="text-xs text-gray-500">Total de questões disponíveis: 0</span>
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questao) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="bg-gray-900 p-6 rounded-3xl shadow-xl text-center max-w-lg">
          <p className="text-red-400 font-semibold">Questão inválida ou inexistente.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const alternativas = Array.isArray(questao.alternativas) && questao.alternativas.length
    ? questao.alternativas
    : [{ letra: 'A', texto: 'Alternativa não disponível' }];

  const respostaAtual = respostas[questao.id_questao] ?? '';

  const finalizarSimulado = async () => {
    if (salvando || finalizado) return;
    setSalvando(true);

    const total = questoes.length;
    const acertos = questoes.reduce((acc, q) => {
      const resposta = respostas[q.id_questao];
      const alternativaCorreta =
        q.alternativa_correta ??
        q.alternativas.find((alt) => alt.correta)?.letra ??
        null;
      return acc + (resposta && alternativaCorreta && resposta === alternativaCorreta ? 1 : 0);
    }, 0);
    const erros = total - acertos;
    const percentual = total ? (acertos / total) * 100 : 0;

    try {
      if (usuarioId && totalRespondidas > 0) {
        const now = new Date().toISOString();
        const payload = questoes
          .map((q) => {
            const resposta = respostas[q.id_questao];
            if (!resposta) return null;
            return {
              id_usuario: usuarioId,
              id_questao: q.id_questao,
              alternativa_marcada: resposta,
              correta: !!q.alternativas.find((alt) => alt.letra === resposta)?.correta,
              data_resposta: now,
              tempo_resposta_ms: null,
            };
          })
          .filter(Boolean) as Array<{
            id_usuario: number;
            id_questao: number;
            alternativa_marcada: string;
            correta: boolean;
            data_resposta: string;
            tempo_resposta_ms: number | null;
          }>;

        if (payload.length) {
          const { error } = await supabase.from('respostas_usuarios').insert(payload);
          if (error) {
            console.error('Erro ao salvar respostas:', error);
            setErro('Não foi possível salvar suas respostas. Tente novamente.');
            setSalvando(false);
            return;
          }
        }
      }

      setResumo({
        total,
        acertos,
        erros,
        percentual: Number(percentual.toFixed(2)),
      });
      setFinalizado(true);
    } catch (saveError) {
      console.error('Erro inesperado ao finalizar simulado', saveError);
      setErro('Ocorreu um erro ao finalizar o simulado.');
    } finally {
      setSalvando(false);
    }
  };

  if (finalizado) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="bg-gray-900 p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-green-400">🎯 Simulado Finalizado</h1>
          <p>Total de questões: {resumo.total}</p>
          <p className="text-green-400 font-semibold">Acertos: {resumo.acertos}</p>
          <p className="text-red-400 font-semibold">Erros: {resumo.erros}</p>
          <p>Aproveitamento: {resumo.percentual}%</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none w-full"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-2 sm:p-10 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-400">🎓 Simulado ENEM</h1>
          <div className="text-gray-400 text-sm">
            Questão {questaoAtual + 1} de {questoes.length}
          </div>
        </div>
        <div className="mb-2 text-right text-xs text-gray-400">
          Total de questões disponíveis neste simulado: <b>{questoes.length}</b>
        </div>
        <div className="mb-2 text-right text-xs text-gray-400">
          Respondidas: <b>{totalRespondidas}</b>
        </div>
        <div className="bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl">
          <div className="mb-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-100">
              {questao.enunciado}
            </h2>
            {questao.imagens && questao.imagens.length > 0 && (
              <div className="space-y-3">
                {questao.imagens.map((img) => (
                  <img
                    key={img.id_imagem}
                    src={img.caminho_arquivo}
                    alt={img.descricao ?? 'Imagem da questão'}
                    className="mx-auto max-h-72 rounded-lg shadow"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 mb-8">
            {alternativas.map((alternativa) => {
              const selecionada = respostaAtual === alternativa.letra;
              return (
                <label
                  key={alternativa.letra}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors text-base sm:text-lg focus-within:ring-2 focus-within:ring-blue-400 border-2 border-transparent ${
                    selecionada ? 'bg-blue-700 border-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  tabIndex={0}
                  aria-label={`Alternativa ${alternativa.letra}`}
                >
                  <input
                    type="radio"
                    name="resposta"
                    value={alternativa.letra}
                    checked={selecionada}
                    onChange={() =>
                      setRespostas((prev) => ({
                        ...prev,
                        [questao.id_questao]: alternativa.letra,
                      }))
                    }
                    className="sr-only"
                  />
                  <span className="font-semibold mr-3 text-blue-400">{alternativa.letra})</span>
                  <span>{alternativa.texto}</span>
                </label>
              );
            })}
          </div>
          {alternativas.some((alt) => alt.imagens && alt.imagens.length) && (
            <div className="mb-8 space-y-4">
              {alternativas.map((alt) =>
                alt.imagens && alt.imagens.length ? (
                  <div key={`alt-img-${alt.id_alternativa}`} className="space-y-2">
                    <p className="text-sm text-gray-400">Imagem alternativa {alt.letra}</p>
                    {alt.imagens.map((img) => (
                      <img
                        key={img.id_imagem}
                        src={img.caminho_arquivo}
                        alt={img.descricao ?? `Imagem da alternativa ${alt.letra}`}
                        className="mx-auto max-h-60 rounded-lg shadow"
                      />
                    ))}
                  </div>
                ) : null
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              onClick={questaoAnterior}
              disabled={questaoAtual === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-6 py-2 rounded-lg w-full sm:w-auto focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              ← Anterior
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              {questaoAtual === questoes.length - 1 ? (
                <button
                  onClick={finalizarSimulado}
                  disabled={salvando || totalRespondidas === 0}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-300 px-6 py-2 rounded-lg font-semibold w-full sm:w-auto focus:ring-2 focus:ring-green-400 focus:outline-none"
                >
                  {salvando ? 'Salvando...' : 'Finalizar Simulado'}
                </button>
              ) : (
                <button
                  onClick={proximaQuestao}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg w-full sm:w-auto focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  Próxima →
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300 underline focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            ← Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
