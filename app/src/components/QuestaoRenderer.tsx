import React, { useState, useEffect } from 'react';
import {
  buscarQuestaoComImagens,
  QuestaoComImagens,
  Imagem,
} from '../services/questoesService';
import { SimuladosService, QuestaoCompleta } from '../services/simuladosService';

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
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'respondidas' | 'nao-respondidas'>('todas');

  useEffect(() => {
    loadSimulado();
  }, [id_simulado]);

  const loadSimulado = async () => {
    try {
      setLoading(true);
      
      // Buscar informações do simulado (prova)
      const simuladoInfo = await SimuladosService.buscarSimulado(id_simulado);
      if (!simuladoInfo) throw new Error('Simulado não encontrado');
      
      // Buscar questões da prova
      const questoes = await SimuladosService.buscarQuestoesSimulado(id_simulado);
      if (!questoes || questoes.length === 0) throw new Error('Nenhuma questão encontrada');
      
      // Montar objeto simulado
      const s: SimuladoComQuestoes = {
        id_prova: simuladoInfo.id_prova,
        nome: simuladoInfo.nome,
        descricao: simuladoInfo.descricao ?? undefined,
        questoes: questoes
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

  // Filtrar questões baseado no status
  const questoesFiltradas = simulado.questoes.filter((questao, idx) => {
    const respondida = respostas.some((r) => r.questao_id === questao.id_questao);
    if (filtroStatus === 'respondidas') return respondida;
    if (filtroStatus === 'nao-respondidas') return !respondida;
    return true;
  });

  return (
    <div className="flex gap-4 w-full">
      {/* Activity Bar - Sidebar de Navegação */}
      <div 
        className={`transition-all duration-300 ${
          sidebarAberta ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="sticky top-4 glass-card p-4 space-y-4">
          {/* Cabeçalho da Sidebar */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Navegação</h3>
            <button
              onClick={() => setSidebarAberta(false)}
              className="text-slate-400 hover:text-slate-100"
            >
              ✕
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{respostas.length}</div>
              <div className="text-xs text-slate-400">Respondidas</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">
                {simulado.questoes.length - respostas.length}
              </div>
              <div className="text-xs text-slate-400">Pendentes</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-semibold">Filtrar</label>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFiltroStatus('todas')}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  filtroStatus === 'todas'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                📋 Todas ({simulado.questoes.length})
              </button>
              <button
                onClick={() => setFiltroStatus('respondidas')}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  filtroStatus === 'respondidas'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ✓ Respondidas ({respostas.length})
              </button>
              <button
                onClick={() => setFiltroStatus('nao-respondidas')}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  filtroStatus === 'nao-respondidas'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ○ Não respondidas ({simulado.questoes.length - respostas.length})
              </button>
            </div>
          </div>

          {/* Lista de Questões */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <label className="text-xs text-slate-400 uppercase font-semibold">
              Questões {filtroStatus !== 'todas' && `(${questoesFiltradas.length})`}
            </label>
            <div className="space-y-1">
              {questoesFiltradas.map((questao, idx) => {
                const questaoIdx = simulado.questoes.findIndex(q => q.id_questao === questao.id_questao);
                const respondida = respostas.some((r) => r.questao_id === questao.id_questao);
                const atual = questaoIdx === questaoAtual;

                return (
                  <button
                    key={questao.id_questao}
                    onClick={() => setQuestaoAtual(questaoIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      atual
                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                        : respondida
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-bold">{questaoIdx + 1}</span>
                    <div className="flex-1 text-left truncate">
                      {questao.enunciado.substring(0, 40)}...
                    </div>
                    <span>
                      {respondida ? '✓' : atual ? '▶' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-400 mb-2">
              Progresso: {Math.round((respostas.length / simulado.questoes.length) * 100)}%
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
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
          className="fixed left-4 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-lg shadow-lg z-50"
        >
          <span className="block transform rotate-180">▶</span>
        </button>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 space-y-6">
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
            {simulado.questoes.slice(0, 10).map((_, idx) => (
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
            {simulado.questoes.length > 10 && (
              <span className="text-slate-400">...</span>
            )}
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
    </div>
  );
}
