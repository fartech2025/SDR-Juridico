import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ensureUsuarioRegistro, fetchQuestoesPorProvaTema, fetchQuestoesIdsPorProvaTema, fetchQuestaoById } from '../../services/supabaseService';
import type { Questao } from '../../types';
import BasePage from '../../components/BasePage';
import QuestionSkeleton from '../../components/ui/QuestionSkeleton';

export default function SimuladoProva() {
  const { id_prova, id_tema } = useParams();
  const navigate = useNavigate();
  
  // agora mantemos apenas a lista de ids e um cache por id
  const [questaoIds, setQuestaoIds] = useState<number[]>([]);
  const [cacheVersion, setCacheVersion] = useState(0);
  const questoesCache = useRef<Map<number, Questao>>(new Map());
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

  const currentId = questaoIds[questaoAtual] ?? null;
  const questao = currentId ? questoesCache.current.get(currentId) ?? null : null;

  // quando mudamos de questão, se não estiver no cache, buscar sob demanda
  useEffect(() => {
    if (!currentId) return;
    if (questoesCache.current.has(currentId)) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await fetchQuestaoById(currentId);
        if (mounted && data) {
          questoesCache.current.set(currentId, data);
          setCacheVersion((v) => v + 1);
          // prefetch próxima questão
          const idx = questaoAtual;
          const nextId = questaoIds[idx + 1];
          if (nextId && !questoesCache.current.has(nextId)) {
            void fetchQuestaoById(nextId).then((res) => {
              if (res.data) {
                questoesCache.current.set(nextId, res.data);
                setCacheVersion((v) => v + 1);
              }
            });
          }
        }
      } catch (e) {
        console.error('Erro ao carregar questão sob demanda', e);
      }
    })();
    return () => { mounted = false; };
  }, [currentId, questaoAtual, setCacheVersion, questaoIds]);

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
    async function carregarQuestoesIds() {
      try {
        const provaId = Number(id_prova);
        if (!Number.isFinite(provaId) || provaId <= 0) {
          setErro('Prova selecionada é inválida.');
          setQuestaoIds([]);
          setLoading(false);
          return;
        }
        const temaId = id_tema === 'completa' ? undefined : Number(id_tema);
        const normalizedTemaId = temaId !== undefined && Number.isFinite(temaId) && temaId > 0 ? temaId : undefined;

        const { data, error } = await fetchQuestoesIdsPorProvaTema(provaId, normalizedTemaId);
        if (error) {
          console.error('Erro ao carregar ids das questões:', error);
          setErro('Não foi possível carregar as questões deste simulado.');
          setQuestaoIds([]);
        } else {
          const ids = (data ?? []).map((r: any) => r.id_questao);
          setQuestaoIds(ids);
          // prefetch primeira questão
          if (ids.length) {
            const firstId = ids[0];
            const { data: q } = await fetchQuestaoById(firstId);
            if (q) questoesCache.current.set(firstId, q);
            // prefetch next
            if (ids.length > 1) {
              const nextId = ids[1];
              void fetchQuestaoById(nextId).then((res) => { if (res.data) questoesCache.current.set(nextId, res.data); });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setErro('Erro inesperado ao carregar questões.');
        setQuestaoIds([]);
      } finally {
        setLoading(false);
      }
    }
    carregarQuestoesIds();
  }, [id_prova, id_tema]);

  const proximaQuestao = () => {
    if (questaoAtual < questaoIds.length - 1) {
      const next = questaoAtual + 1;
      setQuestaoAtual(next);
      // prefetch subsequent question
      const nextId = questaoIds[next + 1];
      if (nextId && !questoesCache.current.has(nextId)) {
        void fetchQuestaoById(nextId).then((res) => { if (res.data) questoesCache.current.set(nextId, res.data); });
      }
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
    }
  };

  if (loading) {
    return (
      <BasePage>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <span className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4" aria-label="Carregando"></span>
          <p className="ds-muted text-center">Carregando questões...</p>
        </div>
      </BasePage>
    );
  }

  if (erro) {
    return (
      <BasePage>
        <div className="glass-card p-6 text-center">
          <h1 className="ds-heading mb-6 text-blue-400">🎓 Simulado ENEM</h1>
          <p className="text-red-400 mb-4">{erro}</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Voltar ao Início
          </button>
        </div>
      </BasePage>
    );
  }

  if (questaoIds.length === 0) {
    return (
      <BasePage>
        <div className="glass-card p-6 text-center">
          <h1 className="ds-heading mb-6 text-blue-400">🎓 Simulado ENEM</h1>
          <p className="ds-muted mb-4">
            Nenhuma questão encontrada para esta prova/tema.<br/>
            <span className="text-xs text-gray-500">Total de questões disponíveis: 0</span>
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Voltar ao Início
          </button>
        </div>
      </BasePage>
    );
  }

  if (!questao) {
    // se não encontramos a questão no cache, pode ser que esteja sendo buscada sob demanda
    if (!currentId) {
      return (
        <BasePage>
          <div className="glass-card p-6 text-center">
            <p className="text-red-400 font-semibold">Questão inválida ou inexistente.</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary mt-4"
            >
              Voltar ao início
            </button>
          </div>
        </BasePage>
      );
    }

    // Render skeleton enquanto carrega a questão atual
    return (
      <BasePage>
        <QuestionSkeleton />
      </BasePage>
    );
  }

  const alternativas = Array.isArray(questao.alternativas) && questao.alternativas.length
    ? questao.alternativas
    : [{ letra: 'A', texto: 'Alternativa não disponível' }];

  const respostaAtual = respostas[questao.id_questao] ?? '';

  const finalizarSimulado = async () => {
    if (salvando || finalizado) return;
    setSalvando(true);

  // total de questões do simulado
    // garantir que temos os detalhes das questões respondidas
    const answeredIds = Object.keys(respostas).map((k) => Number(k)).filter(Boolean);
    const missing = answeredIds.filter((id) => !questoesCache.current.has(id));
    if (missing.length) {
      // buscar em batch as questões faltantes
      const { data } = await supabase.from('questoes').select('id_questao').in('id_questao', missing);
      // fallback: sequential fetch via fetchQuestaoById for each missing
      for (const id of missing) {
        const { data: q } = await fetchQuestaoById(id);
        if (q) questoesCache.current.set(id, q);
      }
    }

  const total = questaoIds.length;
    const acertos = answeredIds.reduce((acc, id) => {
      const q = questoesCache.current.get(id);
      if (!q) return acc;
      const alternativaCorreta = q.alternativa_correta ?? q.alternativas.find((alt) => alt.correta)?.letra ?? null;
      const resposta = respostas[id];
      return acc + (resposta && alternativaCorreta && resposta === alternativaCorreta ? 1 : 0);
    }, 0);
    const erros = Object.keys(respostas).filter((k) => respostas[Number(k)]).length - acertos;
    const percentual = total ? (acertos / total) * 100 : 0;

    try {
      if (usuarioId && totalRespondidas > 0) {
        const now = new Date().toISOString();
        const payload = answeredIds
          .map((id) => {
            const resposta = respostas[id];
            if (!resposta) return null;
            const q = questoesCache.current.get(id);
            const correta = !!q?.alternativas.find((alt) => alt.letra === resposta)?.correta;
            return {
              id_usuario: usuarioId,
              id_questao: id,
              alternativa_marcada: resposta,
              correta,
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
      <BasePage>
        <div className="glass-card p-8 text-center space-y-4">
          <h1 className="ds-heading text-green-400">🎯 Simulado Finalizado</h1>
          <p>Total de questões: {resumo.total}</p>
          <p className="text-green-400 font-semibold">Acertos: {resumo.acertos}</p>
          <p className="text-red-400 font-semibold">Erros: {resumo.erros}</p>
          <p>Aproveitamento: {resumo.percentual}%</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Voltar ao início
          </button>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <h1 className="ds-heading text-blue-400">🎓 Simulado ENEM</h1>
          <div className="ds-muted text-sm">
            Questão {questaoAtual + 1} de {questaoIds.length}
          </div>
        </div>
        <div className="mb-2 text-right text-xs ds-muted">
          Total de questões disponíveis neste simulado: <b>{questaoIds.length}</b>
        </div>
        <div className="mb-2 text-right text-xs ds-muted">
          Respondidas: <b>{totalRespondidas}</b>
        </div>
        <div className="glass-card p-4 sm:p-8">
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
              className="btn btn-ghost w-full sm:w-auto"
            >
              ← Anterior
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              {questaoAtual === questaoIds.length - 1 ? (
                <button
                  onClick={finalizarSimulado}
                  disabled={salvando || totalRespondidas === 0}
                  className="btn btn-success w-full sm:w-auto"
                >
                  {salvando ? 'Salvando...' : 'Finalizar Simulado'}
                </button>
              ) : (
                <button
                  onClick={proximaQuestao}
                  className="btn btn-primary w-full sm:w-auto"
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
            className="ds-muted underline hover:text-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            ← Voltar ao início
          </button>
        </div>
      </div>
    </BasePage>
  );
}
