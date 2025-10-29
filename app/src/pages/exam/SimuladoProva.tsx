import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchQuestoesPorProvaTema } from '../../services/supabaseService';
import type { Questao } from '../../types';
import { FormattedTextRenderer } from '../../components/text/FormattedTextRenderer';
import { QuestionMarker, QuestionStatus } from '../../components/exam/QuestionMarker';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import imageService from '../../services/imageService';

export default function SimuladoProva() {
  const { id_prova, id_tema } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Verificar se há parâmetros de URL para filtros
  const anoParam = searchParams.get('ano');
  const temaParam = searchParams.get('tema');

  useEffect(() => {
    const carregarQuestoes = async () => {
      try {
        console.log(`Carregando questões para prova ${id_prova}, tema ${id_tema}`);
        
        let provaId: number | undefined;
        let temaId: number | undefined;
        
        // Priorizar parâmetros de URL sobre parâmetros de rota
        if (anoParam) {
          provaId = Number(anoParam);
        } else if (id_prova && id_prova !== 'undefined') {
          provaId = Number(id_prova);
        }
        
        if (temaParam && temaParam !== 'undefined') {
          temaId = Number(temaParam);
        } else if (id_tema && id_tema !== 'completa' && id_tema !== 'undefined') {
          temaId = Number(id_tema);
        }
        
        console.log(`🔍 Filtros aplicados - Prova ID: ${provaId}, Tema ID: ${temaId}`);
        
        // Garantir que os parâmetros sejam válidos antes de fazer a consulta
        if (provaId === undefined && temaId === undefined) {
          console.warn('Nenhum filtro foi fornecido');
          setQuestoes([]);
          setQuestionStatuses([]);
          return;
        }
        
        const { data, error } = await fetchQuestoesPorProvaTema(provaId, temaId);
        if (error) {
          console.error('Erro ao carregar questões:', error);
          setQuestoes([]);
          setQuestionStatuses([]);
        } else {
          console.log(`✅ Questões carregadas: ${data?.length || 0} questões`);
          if (data && data.length > 0) {
            console.log(`📋 Primeira questão: ID ${data[0].id_questao}, Tema ${data[0].id_tema}`);
            setQuestoes(data);
            // Inicializar status das questões
            setQuestionStatuses(Array(data.length).fill(null).map(() => ({ answered: false })));
          } else {
            setQuestoes([]);
            setQuestionStatuses([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setQuestoes([]);
        setQuestionStatuses([]);
      } finally {
        setLoading(false);
      }
    };
    carregarQuestoes();
  }, [id_prova, id_tema, anoParam, temaParam]);

  const irParaQuestao = (index: number) => {
    if (index >= 0 && index < questoes.length) {
      setQuestaoAtual(index);
      // Recuperar resposta salva para esta questão
      const savedAnswer = questionStatuses[index]?.selectedAnswer;
      setRespostaSelecionada(savedAnswer || '');
    }
  };

  const salvarResposta = (resposta: string) => {
    setRespostaSelecionada(resposta);
    
    // Atualizar status da questão
    const newStatuses = [...questionStatuses];
    const questao = questoes[questaoAtual];
    
    // Verificar se a resposta está correta
    let isCorrect: boolean | undefined = undefined;
    if (questao.alternativas && questao.alternativas.length > 0) {
      const alternativaCorreta = questao.alternativas.find(alt => alt.correta);
      if (alternativaCorreta) {
        isCorrect = resposta === alternativaCorreta.texto;
      }
    }
    
    newStatuses[questaoAtual] = {
      answered: true,
      correct: isCorrect,
      selectedAnswer: resposta
    };
    
    setQuestionStatuses(newStatuses);
  };

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      irParaQuestao(questaoAtual + 1);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      irParaQuestao(questaoAtual - 1);
    }
  };

  const finalizarSimulado = () => {
    setShowResults(true);
  };

  const voltarAoInicio = () => {
    navigate('/');
  };

  // Tela de resultados
  if (showResults) {
    const totalRespondidas = questionStatuses.filter(status => status?.answered).length;
    const totalCorretas = questionStatuses.filter(status => status?.correct === true).length;
    const totalIncorretas = questionStatuses.filter(status => status?.correct === false).length;
    const percentualAcerto = totalRespondidas > 0 ? Math.round((totalCorretas / totalRespondidas) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto">
          <div className="glass-card p-8 text-center space-y-6">
            <h1 className="text-3xl font-bold text-white mb-2">🎓 Simulado Finalizado!</h1>
            <p className="text-slate-300">Confira seu desempenho no simulado</p>
            
            {/* Stats principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-400">{questoes.length}</div>
                <div className="text-sm text-slate-400">Total</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-400">{totalRespondidas}</div>
                <div className="text-sm text-slate-400">Respondidas</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">{totalCorretas}</div>
                <div className="text-sm text-slate-400">Acertos</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-400">{totalIncorretas}</div>
                <div className="text-sm text-slate-400">Erros</div>
              </div>
            </div>

            {/* Percentual de acerto */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{percentualAcerto}%</div>
                <div className="text-slate-400">Taxa de Acerto</div>
              </div>
              
              <div className="progress-bar h-4">
                <div 
                  className="progress-fill h-full"
                  style={{ width: `${percentualAcerto}%` }}
                />
              </div>
            </div>

            {/* Mensagem de performance */}
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-slate-300">
                {percentualAcerto >= 80 ? '🌟 Excelente desempenho! Continue assim!' :
                 percentualAcerto >= 60 ? '👍 Bom desempenho! Continue estudando!' :
                 percentualAcerto >= 40 ? '📖 Desempenho regular. Foque nos estudos!' :
                 '💪 Continue se esforçando! A prática leva à perfeição!'}
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => {
                  setShowResults(false);
                  setQuestaoAtual(0);
                  setRespostaSelecionada('');
                  setQuestionStatuses(Array(questoes.length).fill(null).map(() => ({ answered: false })));
                }}
                className="btn-secondary flex-1"
              >
                Refazer Simulado
              </button>
              <button
                onClick={voltarAoInicio}
                className="btn-primary flex-1"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const questao = questoes[questaoAtual];
  let alternativas: string[] = [];
  
  if (questao.alternativas && questao.alternativas.length > 0) {
    // Nova estrutura: array de objetos com letra, texto, correta
    alternativas = questao.alternativas
      .sort((a, b) => a.letra.localeCompare(b.letra)) // Ordenar por letra (A, B, C, D, E)
      .map(alt => alt.texto)
      .filter((texto): texto is string => texto !== null); // Filtrar valores nulos e manter tipo string
  } else {
    // Fallback se não houver alternativas
    alternativas = [
      'Alternativa A não disponível',
      'Alternativa B não disponível', 
      'Alternativa C não disponível',
      'Alternativa D não disponível',
      'Alternativa E não disponível'
    ];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            🎓 Simulado ENEM
            {anoParam && <span className="text-blue-400">- {anoParam}</span>}
          </h1>
          <div className="text-slate-400 text-sm">
            Questão {questaoAtual + 1} de {questoes.length}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Marcador de Questões - Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-6">
              <QuestionMarker
                totalQuestions={questoes.length}
                currentQuestion={questaoAtual}
                questionStatuses={questionStatuses}
                onQuestionClick={irParaQuestao}
                onFinishExam={finalizarSimulado}
              />
            </div>
          </div>

          {/* Questão Principal */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="glass-card p-6 sm:p-8">
              {/* Enunciado da Questão */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-400">
                    Questão {questaoAtual + 1}
                  </span>
                  {questao.dificuldade && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      questao.dificuldade.toLowerCase() === 'fácil' || questao.dificuldade.toLowerCase() === 'facil' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      questao.dificuldade.toLowerCase() === 'médio' || questao.dificuldade.toLowerCase() === 'medio' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      questao.dificuldade.toLowerCase() === 'difícil' || questao.dificuldade.toLowerCase() === 'dificil' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {questao.dificuldade}
                    </span>
                  )}
                </div>
                
                <FormattedTextRenderer 
                  text={questao.enunciado || "Enunciado não disponível"}
                  showSummary={false}
                  maxHeight={600}
                  className="text-base sm:text-lg text-slate-100 leading-relaxed"
                  questionNumber={questao.nr_questao}
                />
                
                {/* Imagem principal da questão usando o imageService */}
                {(() => {
                  const mainImageUrl = imageService.getMainImageUrlByNumber(questao.nr_questao);
                  
                  return mainImageUrl && (
                    <div className="mt-6 text-center">
                      <img 
                        src={mainImageUrl} 
                        alt={`Imagem da questão ${questao.nr_questao}`} 
                        className="mx-auto max-h-64 rounded-lg shadow-lg" 
                        onError={(e) => {
                          console.error(`Erro ao carregar imagem da questão ${questao.nr_questao}:`, mainImageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Questão {questao.nr_questao} - Imagem
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Alternativas */}
              <div className="space-y-3 mb-8">
                {alternativas.map((alternativa, index) => {
                  const letra = String.fromCharCode(65 + index); // A, B, C, D, E
                  const isSelected = respostaSelecionada === alternativa;
                  
                  return (
                    <label
                      key={index}
                      className={`
                        flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200
                        text-base sm:text-lg focus-within:ring-2 focus-within:ring-blue-400 
                        border-2 hover:scale-[1.02]
                        ${isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                        }
                      `}
                      tabIndex={0}
                      aria-label={`Alternativa ${letra}`}
                    >
                      <input
                        type="radio"
                        name="resposta"
                        value={alternativa}
                        checked={isSelected}
                        onChange={(e) => salvarResposta(e.target.value)}
                        className="sr-only"
                      />
                      
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold text-sm
                        ${isSelected 
                          ? 'bg-blue-500 border-blue-400 text-white' 
                          : 'border-slate-500 text-slate-400'
                        }
                      `}>
                        {letra}
                      </div>
                      
                      <FormattedTextRenderer 
                        text={alternativa}
                        className="flex-1 text-slate-200"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Navegação */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700">
                <button
                  onClick={questaoAnterior}
                  disabled={questaoAtual === 0}
                  className="btn-ghost flex items-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  Anterior
                </button>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={finalizarSimulado}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    Finalizar
                  </button>
                  
                  {questaoAtual === questoes.length - 1 ? (
                    <button
                      onClick={finalizarSimulado}
                      className="btn-primary flex-1 sm:flex-none"
                    >
                      Concluir Simulado
                    </button>
                  ) : (
                    <button
                      onClick={proximaQuestao}
                      className="btn-primary flex items-center gap-2 flex-1 sm:flex-none"
                    >
                      Próxima
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={voltarAoInicio}
            className="text-slate-400 hover:text-slate-300 underline focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            ← Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}