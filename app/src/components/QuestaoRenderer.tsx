import React, { useState, useEffect } from 'react';
import {
  buscarQuestaoComImagens,
  buscarSimuladoComQuestoes,
  QuestaoComImagens,
  SimuladoComQuestoes,
  Imagem,
} from '../services/questoesService';

interface QuestaoRendererProps {
  id_questao: number;
  onResposta?: (resposta: string) => void;
}

interface RespostaUsuario {
  questao_id: number;
  resposta: string;
  timestamp: number;
}

/**
 * Componente para renderizar uma questão com suas imagens
 */
export function QuestaoRenderer({ id_questao, onResposta }: QuestaoRendererProps) {
  const [questao, setQuestao] = useState<QuestaoComImagens | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);

  useEffect(() => {
    loadQuestao();
  }, [id_questao]);

  const loadQuestao = async () => {
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
              onError={(e) => {
                console.error(`Erro ao carregar imagem: ${img.caminho_arquivo}`);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const handleResponder = (letra: string) => {
    setRespostaSelecionada(letra);
    onResposta?.(letra);
  };

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

  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    { letra: 'E', texto: questao.alternativa_e },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100">
            Questão {questao.id_questao}
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
          <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
            {questao.enunciado}
          </p>
          {renderImagemEntidade(questao.imagens, 'questao')}
        </div>
      </div>

      {/* Alternativas */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-200">Alternativas:</h3>
        {alternativas.map((alt) => (
          <div key={alt.letra} className="space-y-2">
            <button
              onClick={() => handleResponder(alt.letra)}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                respostaSelecionada === alt.letra
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                    respostaSelecionada === alt.letra
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-slate-600 text-slate-400'
                  }`}
                >
                  {alt.letra}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {alt.texto}
                  </p>
                </div>
              </div>
            </button>
            {renderImagemEntidade(questao.imagens, 'alternativa')}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SimuladoRendererProps {
  id_simulado: number;
  onSimuladoCompleto?: (respostas: RespostaUsuario[]) => void;
}

/**
 * Componente para renderizar um simulado completo com todas as questões
 */
export function SimuladoRenderer({
  id_simulado,
  onSimuladoCompleto,
}: SimuladoRendererProps) {
  const [simulado, setSimulado] = useState<SimuladoComQuestoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<RespostaUsuario[]>([]);

  useEffect(() => {
    loadSimulado();
  }, [id_simulado]);

  const loadSimulado = async () => {
    try {
      setLoading(true);
      const s = await buscarSimuladoComQuestoes(id_simulado);
      if (!s) throw new Error('Simulado não encontrado');
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
  };

  const handleResposta = (resposta: string) => {
    const novaResposta: RespostaUsuario = {
      questao_id: simulado!.questoes[questaoAtual].id_questao,
      resposta,
      timestamp: Date.now(),
    };

    const respostasAtualizado = respostas.filter(
      (r) => r.questao_id !== novaResposta.questao_id
    );
    respostasAtualizado.push(novaResposta);
    setRespostas(respostasAtualizado);
  };

  const irProxima = () => {
    if (questaoAtual < simulado!.questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
    }
  };

  const irAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
    }
  };

  const finalizarSimulado = () => {
    onSimuladoCompleto?.(respostas);
  };

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

  const questaoAtualObj = simulado.questoes[questaoAtual];
  const temRespostaAtual = respostas.some(
    (r) => r.questao_id === questaoAtualObj.id_questao
  );

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho do Simulado */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">{simulado.nome}</h1>
        {simulado.descricao && (
          <p className="text-slate-400">{simulado.descricao}</p>
        )}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            Questão {questaoAtual + 1} de {simulado.questoes.length}
          </span>
          <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{
                width: `${((questaoAtual + 1) / simulado.questoes.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-slate-400">
            {respostas.length} respondidas
          </span>
        </div>
      </div>

      {/* Questão Atual */}
      <QuestaoRenderer
        id_questao={questaoAtualObj.id_questao}
        onResposta={handleResposta}
      />

      {/* Navegação */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-700">
        <button
          onClick={irAnterior}
          disabled={questaoAtual === 0}
          className="px-6 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        <div className="flex gap-2">
          {simulado.questoes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setQuestaoAtual(idx)}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                idx === questaoAtual
                  ? 'bg-blue-500 text-white'
                  : respostas.some((r) => r.questao_id === simulado.questoes[idx].id_questao)
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {questaoAtual === simulado.questoes.length - 1 ? (
          <button
            onClick={finalizarSimulado}
            disabled={!temRespostaAtual}
            className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
          >
            Finalizar ✓
          </button>
        ) : (
          <button
            onClick={irProxima}
            disabled={!temRespostaAtual}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima →
          </button>
        )}
      </div>
    </div>
  );
}
