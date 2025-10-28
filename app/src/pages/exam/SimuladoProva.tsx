import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuestoesPorProvaTema } from '../../services/supabaseService';
import type { Questao } from '../../types';

export default function SimuladoProva() {
  const { id_prova, id_tema } = useParams();
  const navigate = useNavigate();
  
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarQuestoes = async () => {
      try {
        console.log(`Carregando questões para prova ${id_prova}, tema ${id_tema}`);
        const temaId = id_tema === 'completa' ? undefined : Number(id_tema);
        console.log(`🔍 Filtros aplicados - Prova ID: ${Number(id_prova)}, Tema ID: ${temaId}`);
        
        const { data, error } = await fetchQuestoesPorProvaTema(Number(id_prova), temaId);
        if (error) {
          console.error('Erro ao carregar questões:', error);
          setQuestoes([]);
        } else {
          console.log(`✅ Questões carregadas: ${data?.length || 0} questões`);
          if (data && data.length > 0) {
            console.log(`📋 Primeira questão: ID ${data[0].id_questao}, Tema ${data[0].id_tema}`);
          }
          setQuestoes(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setQuestoes([]);
      } finally {
        setLoading(false);
      }
    };
    carregarQuestoes();
  }, [id_prova, id_tema]);

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
      setRespostaSelecionada('');
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1);
      setRespostaSelecionada('');
    }
  };

  const finalizarSimulado = () => {
    alert('Simulado finalizado! (Em desenvolvimento)');
    navigate('/');
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
      .filter(Boolean);
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
        <div className="bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-100">
              {questao.enunciado}
            </h2>
            {questao.imagem_url && (
              <img src={questao.imagem_url} alt="Imagem da questão" className="mx-auto mb-4 max-h-64 rounded-lg shadow" />
            )}
          </div>
          <div className="space-y-3 mb-8">
            {alternativas.map((alternativa, index) => {
              const letra = String.fromCharCode(65 + index); // A, B, C, D, E
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors text-base sm:text-lg focus-within:ring-2 focus-within:ring-blue-400 border-2 border-transparent ${
                    respostaSelecionada === alternativa
                      ? 'bg-blue-700 border-blue-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  tabIndex={0}
                  aria-label={`Alternativa ${letra}`}
                >
                  <input
                    type="radio"
                    name="resposta"
                    value={alternativa}
                    checked={respostaSelecionada === alternativa}
                    onChange={(e) => setRespostaSelecionada(e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-semibold mr-3 text-blue-400">{letra})</span>
                  <span>{alternativa}</span>
                </label>
              );
            })}
          </div>
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
                  className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-semibold w-full sm:w-auto focus:ring-2 focus:ring-green-400 focus:outline-none"
                >
                  Finalizar Simulado
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