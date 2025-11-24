import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  buscarQuestaoComImagens,
  QuestaoComImagens,
  Imagem,
} from '../services/questoesService';
import { SimuladosService, QuestaoCompleta } from '../services/simuladosService';
import type { SimuladoSidebarData } from './pages/simulation/SidebarPerformance';

const EMPTY_QUESTOES: QuestaoCompleta[] = [];

// Interface temporária para compatibilidade
interface SimuladoComQuestoes {
  id_prova: number;
  nome: string;
  descricao?: string;
  questoes: QuestaoCompleta[];
}

interface QuestaoRendererProps {
  id_questao: number;
  onResposta?: (resposta: string) => void;
}

export interface RespostaUsuario {
  questao_id: number;
  resposta: string;
  tempoRespostaMs: number;
  correta?: boolean;
  answeredAt?: number;
}

/**
 * Componente para renderizar uma questão com suas imagens
 */
export function QuestaoRenderer({ id_questao, onResposta }: QuestaoRendererProps) {
  const [questao, setQuestao] = useState<QuestaoComImagens | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respostaConfirmada, setRespostaConfirmada] = useState(false);
  const [acertou, setAcertou] = useState<boolean | null>(null);

  const loadQuestao = useCallback(async () => {
    try {
      setLoading(true);
      const q = await buscarQuestaoComImagens(id_questao);
      if (!q) throw new Error('Questão não encontrada');
      setQuestao(q);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar questão');
      setQuestao(null);
    } finally {
      setLoading(false);
    }
  }, [id_questao]);

  useEffect(() => {
    loadQuestao();
    // Resetar estado ao mudar de questão
    setRespostaSelecionada(null);
    setRespostaConfirmada(false);
    setAcertou(null);
  }, [loadQuestao]);

  // Função para extrair URLs do texto e separá-las do conteúdo
  const processarTextoComImagens = (texto: string): { texto: string; urls: string[] } => {
    const urlPattern = /(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp))/gi;
    const urls: string[] = [];
    
    // Extrair todas as URLs de imagem
    const matches = texto.match(urlPattern);
    if (matches) {
      urls.push(...matches);
    }
    
    // Remover as URLs do texto
    const textoLimpo = texto.replace(urlPattern, '').trim();
    
    return { texto: textoLimpo, urls };
  };

  const renderImagemEntidade = (imagens: Imagem[] | undefined, tipo: 'questao' | 'alternativa') => {
    if (!imagens) return null;

    const imagensFiltradas = imagens.filter((img) => img.tipo_entidade === tipo);
    if (imagensFiltradas.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {imagensFiltradas.map((img) => (
          <div key={img.id_imagem} className="flex flex-col gap-2">
            {img.descricao && <p className="text-sm text-slate-400">{img.descricao}</p>}
            <img
              src={img.caminho_arquivo}
              alt={img.descricao || `Imagem da ${tipo}`}
              className="max-w-full h-auto rounded-lg border border-slate-700"
              onError={() => {
                console.error(`Erro ao carregar imagem: ${img.caminho_arquivo}`);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Função para renderizar imagens extraídas do texto (apenas se não estiverem no banco)
  const renderImagensExtraidas = (urls: string[], imagensDoBanco: Imagem[] = []) => {
    if (urls.length === 0) return null;

    // Filtrar URLs que já existem nas imagens do banco
    const urlsDoBanco = imagensDoBanco.map((img) => img.caminho_arquivo);
    const urlsUnicas = urls.filter((url) => !urlsDoBanco.includes(url));

    if (urlsUnicas.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {urlsUnicas.map((url, index) => (
          <div key={`extracted-${index}`} className="flex flex-col gap-2">
            <img
              src={url}
              alt={`Imagem da questão ${index + 1}`}
              className="max-w-full h-auto rounded-lg border border-slate-700"
              onError={() => {
                console.error(`Erro ao carregar imagem: ${url}`);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const handleSelecionarResposta = (letra: string) => {
    if (!respostaConfirmada) {
      setRespostaSelecionada(letra);
    }
  };

  const handleConfirmarResposta = () => {
    if (!respostaSelecionada || !questao) return;
    
    setRespostaConfirmada(true);
    const respostaEstaCorreta = respostaSelecionada === questao.resposta_correta;
    setAcertou(respostaEstaCorreta);
    
    // Notificar o componente pai
    onResposta?.(respostaSelecionada);
  };

  const alternativas = useMemo(() => {
    if (!questao) {
      return [];
    }

    const base = [
      { letra: 'A', texto: questao.alternativa_a },
      { letra: 'B', texto: questao.alternativa_b },
      { letra: 'C', texto: questao.alternativa_c },
      { letra: 'D', texto: questao.alternativa_d },
      { letra: 'E', texto: questao.alternativa_e },
    ].map((alt) => {
      const { texto, urls } = processarTextoComImagens(alt.texto || '');
      return { ...alt, texto, imagensExtraidas: urls };
    });

    for (let i = base.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  }, [questao?.id_questao]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">⏳</div> Carregando questão...
      </div>
    );
  }

  if (erro || !questao) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {erro || 'Erro ao carregar a questão'}
      </div>
    );
  }

  // Processar enunciado para extrair URLs de imagens
  const { texto: enunciadoLimpo, urls: imagensNoEnunciado } = processarTextoComImagens(questao.enunciado || '');

  const numeroQuestao = questao.nr_questao ?? questao.id_questao;

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100">
            Questão {numeroQuestao}
          </h2>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
              {questao.tema}
            </span>
            <span className={`px-3 py-1 rounded-full border ${
              questao.dificuldade === 'Fácil'
                ? 'bg-green-500/10 text-green-300 border-green-500/20'
                : questao.dificuldade === 'Médio'
                ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}>
              {questao.dificuldade}
            </span>
            {questao.ano_enem && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">
                ENEM {questao.ano_enem}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enunciado */}
      <div className="space-y-4">
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          {enunciadoLimpo && (
            <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
              {enunciadoLimpo}
            </p>
          )}
          {renderImagensExtraidas(imagensNoEnunciado, questao.imagens)}
          {renderImagemEntidade(questao.imagens, 'questao')}
        </div>
      </div>

      {/* Alternativas */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-200">Alternativas:</h3>
        {alternativas.map((alt) => {
          const isResposta = alt.letra === respostaSelecionada;
          const isCorreta = alt.letra === questao.resposta_correta;
          const mostrarCorrecao = respostaConfirmada;
          
          let estilo = 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800';
          
          if (mostrarCorrecao) {
            // Após confirmar: mostrar correção
            if (isCorreta) {
              estilo = 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/30';
            } else if (isResposta && !isCorreta) {
              estilo = 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/30';
            } else {
              estilo = 'bg-slate-800/50 border-slate-700 opacity-60';
            }
          } else if (isResposta) {
            // Antes de confirmar: apenas mostrar seleção
            estilo = 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30';
          }
          
          return (
            <div key={alt.letra} className="space-y-2">
              <button
                onClick={() => handleSelecionarResposta(alt.letra)}
                disabled={respostaConfirmada}
                className={`w-full p-4 rounded-lg border transition-all text-left ${estilo} ${
                  respostaConfirmada ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                      mostrarCorrecao
                        ? isCorreta
                          ? 'bg-green-500 border-green-500 text-white'
                          : isResposta && !isCorreta
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-slate-600 text-slate-400'
                        : isResposta
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    {mostrarCorrecao && isCorreta ? '✓' : mostrarCorrecao && isResposta && !isCorreta ? '✗' : alt.letra}
                  </div>
                  <div className="flex-1 pt-1">
                    {alt.texto && (
                      <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                        {alt.texto}
                      </p>
                    )}
                  </div>
                </div>
              </button>
              {alt.imagensExtraidas && renderImagensExtraidas(alt.imagensExtraidas, questao.imagens)}
              {renderImagemEntidade(questao.imagens, 'alternativa')}
            </div>
          );
        })}
      </div>

      {/* Botão Confirmar Resposta */}
      {respostaSelecionada && !respostaConfirmada && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleConfirmarResposta}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-green-500/50 text-lg"
          >
            ✓ Confirmar Resposta
          </button>
        </div>
      )}

      {/* Feedback após confirmação */}
      {respostaConfirmada && (
        <div className={`p-4 rounded-lg border-2 ${
          acertou 
            ? 'bg-green-500/10 border-green-500 text-green-300' 
            : 'bg-red-500/10 border-red-500 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{acertou ? '🎉' : '😔'}</span>
            <div>
              <p className="font-bold text-lg">
                {acertou ? 'Parabéns! Resposta correta!' : 'Ops! Resposta incorreta'}
              </p>
              {!acertou && (
                <p className="text-sm mt-1">
                  A resposta correta é a alternativa <span className="font-bold">{questao.resposta_correta}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SimuladoRendererProps {
  id_simulado: number;
  onSimuladoCompleto?: (respostas: RespostaUsuario[]) => void;
  onProgressUpdate?: (data: SimuladoSidebarData) => void;
}

/**
 * Componente para renderizar um simulado completo com todas as questões
 */
export function SimuladoRenderer({
  id_simulado,
  onSimuladoCompleto,
  onProgressUpdate,
}: SimuladoRendererProps) {
  const [simulado, setSimulado] = useState<SimuladoComQuestoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<RespostaUsuario[]>([]);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [temaFiltrado, setTemaFiltrado] = useState<number | null>(null);
  const [tempoQuestaoInicio, setTempoQuestaoInicio] = useState(() => Date.now());

  const loadSimulado = useCallback(async () => {
    try {
      setLoading(true);
      const simuladoInfo = await SimuladosService.buscarSimulado(id_simulado);
      if (!simuladoInfo) throw new Error('Simulado não encontrado');

      const questoes = await SimuladosService.buscarQuestoesSimulado(id_simulado);
      if (!questoes || questoes.length === 0) throw new Error('Nenhuma questão encontrada');

      const s: SimuladoComQuestoes = {
        id_prova: simuladoInfo.id_prova,
        nome: simuladoInfo.nome,
        descricao: simuladoInfo.descricao ?? undefined,
        questoes
      };

      setSimulado(s);
      setErro(null);
      setQuestaoAtual(0);
      setRespostas([]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar simulado');
      setSimulado(null);
    } finally {
      setLoading(false);
    }
  }, [id_simulado]);

  useEffect(() => {
    loadSimulado();
  }, [loadSimulado]);

  useEffect(() => {
    setTempoQuestaoInicio(Date.now());
  }, [questaoAtual]);

  useEffect(() => {
    if (!simulado) return;
    setTempoQuestaoInicio(Date.now());
  }, [simulado?.id_prova]);

  const handleResposta = (resposta: string) => {
    if (!simulado) return;
    const questaoAtualObj = simulado.questoes[questaoAtual];
    const alternativaCorreta = questaoAtualObj.alternativas.find((a) => a.correta);
    const tempoRespostaMs = Math.max(Date.now() - tempoQuestaoInicio, 0);

    const novaResposta: RespostaUsuario = {
      questao_id: questaoAtualObj.id_questao,
      resposta,
      tempoRespostaMs,
      correta: resposta === alternativaCorreta?.letra,
      answeredAt: Date.now(),
    };

    setRespostas((prev) => {
      const filtradas = prev.filter((r) => r.questao_id !== novaResposta.questao_id);
      return [...filtradas, novaResposta];
    });
  };

  const irParaQuestaoFiltrada = (offset: number) => {
    if (!temaFiltrado) return false;
    const questaoAtualGlobal = simulado!.questoes[questaoAtual];
    const indiceFiltradoAtual = questoesFiltradas.findIndex(
      (q) => q.id_questao === questaoAtualGlobal.id_questao
    );
    if (indiceFiltradoAtual === -1) return false;
    const destino = questoesFiltradas[indiceFiltradoAtual + offset];
    if (!destino) return false;
    const indiceGlobal = simulado!.questoes.findIndex((q) => q.id_questao === destino.id_questao);
    if (indiceGlobal === -1) return false;
    setQuestaoAtual(indiceGlobal);
    return true;
  };

  const irProxima = () => {
    if (temaFiltrado && irParaQuestaoFiltrada(1)) {
      return;
    }
    if (questaoAtual < simulado!.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
    }
  };

  const irAnterior = () => {
    if (temaFiltrado && irParaQuestaoFiltrada(-1)) {
      return;
    }
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
    }
  };

  const finalizarSimulado = () => {
    onSimuladoCompleto?.(respostas);
  };

  const questoesBase = simulado?.questoes ?? EMPTY_QUESTOES;

  const questoesFiltradas = useMemo(() => {
    return temaFiltrado
      ? questoesBase.filter((q) => q.id_tema === temaFiltrado)
      : questoesBase;
  }, [questoesBase, temaFiltrado]);

  const questaoAtualObj = questoesBase[questaoAtual];
  const temRespostaAtual = questaoAtualObj
    ? respostas.some((r) => r.questao_id === questaoAtualObj.id_questao)
    : false;

  useEffect(() => {
    if (!temaFiltrado) return;
    if (!questoesFiltradas.length) return;
    const pertenceAoFiltro = questoesFiltradas.some(
      (q) => q.id_questao === questaoAtualObj?.id_questao
    );
    if (!pertenceAoFiltro) {
      const primeira = questoesFiltradas[0];
      const indiceGlobal = questoesBase.findIndex(
        (q) => q.id_questao === primeira.id_questao
      );
      if (indiceGlobal !== -1) {
        setQuestaoAtual(indiceGlobal);
      }
    }
  }, [temaFiltrado, questoesFiltradas, questaoAtualObj?.id_questao, questoesBase]);

  useEffect(() => {
    if (!simulado || !onProgressUpdate) return;
    const total = simulado.questoes.length;
    const respondidas = respostas.length;
    const corretas = respostas.filter((r) => r.correta).length;
    const tempoMedioSegundos =
      respondidas > 0
        ? respostas.reduce((acc, r) => acc + (r.tempoRespostaMs ?? 0), 0) / respondidas / 1000
        : 0;
    const tempoNormalizado = Number.isFinite(tempoMedioSegundos)
      ? Number(tempoMedioSegundos.toFixed(1))
      : 0;

    const payload: SimuladoSidebarData = {
      total,
      respondidas,
      corretas,
      tempoMedio: tempoNormalizado,
    };
    onProgressUpdate(payload);
  }, [simulado, respostas, onProgressUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">⏳</div> Carregando simulado...
      </div>
    );
  }

  if (erro || !simulado) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {erro || 'Erro ao carregar o simulado'}
      </div>
    );
  }

  // Extrair temas únicos das questões
  const temasUnicos = Array.from(
    new Map(
      simulado.questoes
        .filter((q) => q.id_tema !== null)
        .map((q) => [q.id_tema!, { id: q.id_tema!, nome: q.nome_tema ?? `Tema ${q.id_tema}` }])
    ).values()
  ).sort((a, b) => {
    // Ordenar por nome
    const nomeA = a.nome?.toLowerCase() || '';
    const nomeB = b.nome?.toLowerCase() || '';
    return nomeA.localeCompare(nomeB);
  });

  const respostasCorretas = respostas.filter((r) => r.correta === true).length;
  const percentualAproveitamento =
    respostas.length > 0 ? Math.round((respostasCorretas / respostas.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Activity Bar - Sidebar de Navegação */}
      <div 
        className={`transition-all duration-300 ${
          sidebarAberta ? 'w-full lg:w-72 max-h-screen' : 'w-0 h-0'
        } overflow-hidden`}
      >
        <div className="sticky top-4 glass-card p-3 md:p-4 space-y-3 md:space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Cabeçalho da Sidebar */}
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-slate-100">Navegação</h3>
            <button
              onClick={() => setSidebarAberta(false)}
              className="text-slate-400 hover:text-slate-100 p-1"
              aria-label="Fechar navegação"
            >
              ✕
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3">
              <div className="text-xl md:text-2xl font-bold text-green-400">{respostas.length}</div>
              <div className="text-[10px] md:text-xs text-slate-400">Respondidas</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3">
              <div className="text-xl md:text-2xl font-bold text-yellow-400">
                {simulado.questoes.length - respostas.length}
              </div>
              <div className="text-[10px] md:text-xs text-slate-400">Pendentes</div>
            </div>
          </div>

          {/* Aproveitamento */}
          {respostas.length > 0 && (
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-300 font-semibold">Aproveitamento</span>
                <span className={`text-2xl font-bold ${
                  percentualAproveitamento >= 70 ? 'text-green-400' : 
                  percentualAproveitamento >= 50 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {percentualAproveitamento}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{respostasCorretas} acertos</span>
                <span>•</span>
                <span>{respostas.length - respostasCorretas} erros</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    percentualAproveitamento >= 70 ? 'bg-green-500' : 
                    percentualAproveitamento >= 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${percentualAproveitamento}%` }}
                />
              </div>
            </div>
          )}

          {/* Filtro por Tema */}
          {temasUnicos.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase font-semibold">
                Filtrar por Tema
              </label>
              <select
                value={temaFiltrado ?? ''}
                onChange={(e) => setTemaFiltrado(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">✅ Todos os temas ({simulado.questoes.length})</option>
                {temasUnicos.map((tema) => {
                  const questoesTema = simulado.questoes.filter((q) => q.id_tema === tema.id);
                  const icone = 
                    tema.nome?.toLowerCase().includes('matematica') ? '🔢' :
                    tema.nome?.toLowerCase().includes('linguagens') ? '📖' :
                    tema.nome?.toLowerCase().includes('natureza') ? '🔬' :
                    tema.nome?.toLowerCase().includes('humanas') ? '🌍' :
                    '📝';
                  
                  return (
                    <option key={tema.id} value={tema.id}>
                      {icone} {tema.nome} ({questoesTema.length})
                    </option>
                  );
                })}
              </select>
              <div className="text-[10px] text-slate-500 mt-1">
                {temasUnicos.length} {temasUnicos.length === 1 ? 'tema' : 'temas'} • {simulado.questoes.filter(q => q.id_tema !== null).length} questões com tema
              </div>
            </div>
          )}

          {/* Grade de Questões - Estilo VS Code */}
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs text-slate-400 uppercase font-semibold">
              Questões {temaFiltrado && `(${questoesFiltradas.length})`}
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-1.5 md:gap-2">
              {questoesFiltradas.map((questao) => {
                const questaoIdxGlobal = simulado.questoes.findIndex((q) => q.id_questao === questao.id_questao);
                const respostaUsuario = respostas.find((r) => r.questao_id === questao.id_questao);
                const respondida = !!respostaUsuario;
                const atual = questaoIdxGlobal === questaoAtual;
                const acertou = respostaUsuario?.correta;

                let estiloBotao = 'bg-slate-700 text-slate-300 hover:bg-slate-600';
                
                if (atual) {
                  estiloBotao = 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1 md:ring-offset-2 ring-offset-slate-900';
                } else if (respondida) {
                  if (acertou) {
                    estiloBotao = 'bg-green-500 text-white hover:bg-green-600';
                  } else {
                    estiloBotao = 'bg-red-500 text-white hover:bg-red-600';
                  }
                }

                return (
                  <button
                    key={questao.id_questao}
                    onClick={() => setQuestaoAtual(questaoIdxGlobal)}
                    className={`w-full aspect-square rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all ${estiloBotao}`}
                    title={`Questão ${questaoIdxGlobal + 1}${respondida ? (acertou ? ' - Correta ✓' : ' - Incorreta ✗') : ''}`}
                    aria-label={`Ir para questão ${questaoIdxGlobal + 1}`}
                  >
                    {questaoIdxGlobal + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="pt-3 md:pt-4 border-t border-slate-700">
            <div className="text-[10px] md:text-xs text-slate-400 mb-2">
              Progresso: {Math.round((respostas.length / simulado.questoes.length) * 100)}%
            </div>
            <div className="h-1.5 md:h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                style={{
                  width: `${(respostas.length / simulado.questoes.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão para abrir sidebar quando fechada */}
      {!sidebarAberta && (
        <button
          onClick={() => setSidebarAberta(true)}
          className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 md:p-3 rounded-r-lg shadow-lg z-50 transition-all"
          aria-label="Abrir navegação"
        >
          <span className="block transform rotate-180 text-sm md:text-base">▶</span>
        </button>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
        {/* Cabeçalho do Simulado */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">{simulado.nome}</h1>
            {simulado.descricao && (
              <p className="text-sm md:text-base text-slate-400">{simulado.descricao}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
              <span className="text-slate-400">
                Questão {questaoAtual + 1} de {simulado.questoes.length}
              </span>
              <span className="text-slate-400">
                {respostas.length} respondidas
              </span>
            </div>
          </div>

          {/* Botão Encerrar Simulado */}
          <button
            onClick={finalizarSimulado}
            className="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-500/50 text-sm md:text-base"
            title="Encerrar e ver resultado"
          >
            🏁 Encerrar
          </button>
        </div>

        {/* Questão Atual */}
        <QuestaoRenderer
          id_questao={questaoAtualObj.id_questao}
          onResposta={handleResposta}
        />

        {/* Navegação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 md:pt-6 border-t border-slate-700">
          <button
            onClick={irAnterior}
            disabled={questaoAtual === 0}
            className="px-4 md:px-6 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
          >
            ← Anterior
          </button>

          <div className="text-slate-400 text-xs md:text-sm text-center order-first sm:order-none">
            Questão {questaoAtual + 1} de {simulado.questoes.length}
          </div>

          {questaoAtual === simulado.questoes.length - 1 ? (
            <button
              onClick={finalizarSimulado}
              disabled={!temRespostaAtual}
              className="px-4 md:px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm md:text-base"
            >
              Finalizar ✓
            </button>
          ) : (
            <button
              onClick={irProxima}
              disabled={!temRespostaAtual}
              className="px-4 md:px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
            >
              Próxima →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
