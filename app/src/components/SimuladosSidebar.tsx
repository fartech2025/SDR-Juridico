import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ensureUsuarioRegistro } from '../services/supabaseService';
import { SimuladosService, type SimuladoDoEnem } from '../services/simuladosService';

type ResultadoAgrupado = {
  id_prova: number;
  total_respondidas: number;
  total_acertos: number;
  percentual: number;
};

interface SimuladosSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SimuladosSidebar({ isOpen = true, onClose }: SimuladosSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(!isOpen);
  const [simulados, setSimulados] = useState<SimuladoDoEnem[]>([]);
  const [resultados, setResultados] = useState<Map<number, ResultadoAgrupado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setError('UsuÃ¡rio nÃ£o autenticado');
        return;
      }

      const perfil = await ensureUsuarioRegistro(user);

      const simuladosDisponiveis = await SimuladosService.listarSimulados();
      setSimulados(simuladosDisponiveis);

      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas_usuarios')
        .select('id_questao, correta, questoes:questoes(id_prova)')
        .eq('id_usuario', perfil.id_usuario);

      if (respostasError) {
        console.error('Erro ao buscar respostas do usuÃ¡rio:', respostasError);
        return;
      }

      const agregados = new Map<number, ResultadoAgrupado>();

      (respostasData ?? []).forEach((linha: any) => {
        const idProva = linha.questoes?.id_prova;
        if (!idProva) return;

        const bucket =
          agregados.get(idProva) ?? {
            id_prova: idProva,
            total_respondidas: 0,
            total_acertos: 0,
            percentual: 0,
          };

        bucket.total_respondidas += 1;
        if (linha.correta) bucket.total_acertos += 1;
        agregados.set(idProva, bucket);
      });

      agregados.forEach((bucket, idProva) => {
        const totalQuestoes =
          simuladosDisponiveis.find((s) => s.id_prova === idProva)?.total_questoes ?? 0;
        bucket.percentual =
          bucket.total_respondidas > 0
            ? Number(((bucket.total_acertos / bucket.total_respondidas) * 100).toFixed(1))
            : 0;
        if (!bucket.total_respondidas && totalQuestoes) {
          bucket.percentual = 0;
        }
      });

      setResultados(new Map(agregados.entries()));
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar simulados');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarSimulado = (simulado: SimuladoDoEnem) => {
    navigate(`/resolver-simulado/${simulado.id_simulado}`);
    onClose?.();
  };

  const handleResumoSimulado = (simulado: SimuladoDoEnem) => {
    const resultado = resultados.get(simulado.id_prova);
    if (!resultado) {
      return;
    }

    const mensagem = [
      `Simulado: ${simulado.nome}`,
      `QuestÃµes respondidas: ${resultado.total_respondidas}/${simulado.total_questoes}`,
      `Acertos: ${resultado.total_acertos}`,
      `Aproveitamento: ${resultado.percentual.toFixed(1)}%`,
    ].join('\n');

    window.alert(mensagem);
  };

  return (
    <div
      className={`lg:fixed lg:left-0 lg:top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 lg:z-40 overflow-y-auto flex-shrink-0 ${
        collapsed ? 'w-20' : 'w-80'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && <h2 className="text-lg font-bold text-blue-400 truncate">Simulados</h2>}
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200"
          aria-label={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">{error}</div>
        ) : simulados.length === 0 ? (
          <div className="text-gray-400 text-sm p-3 text-center">
            Nenhuma prova vinculada encontrada.
          </div>
        ) : (
          simulados.map((simulado) => {
            const resultado = resultados.get(simulado.id_prova);
            const progresso = resultado
              ? Math.min(
                  100,
                  (resultado.total_respondidas / simulado.total_questoes) * 100 || 0
                )
              : 0;

            return (
              <div
                key={simulado.id_simulado}
                className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 space-y-3 hover:border-blue-600 transition"
              >
                {collapsed ? (
                  <div className="text-xs font-bold text-center truncate">
                    {simulado.nome.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-slate-100 leading-tight">{simulado.nome}</div>
                    {simulado.descricao && (
                      <p className="text-xs text-slate-400 line-clamp-2">{simulado.descricao}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{simulado.total_questoes} questÃµes</span>
                      <span>{progresso.toFixed(0)}% concluÃ­do</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </>
                )}

                {!collapsed && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIniciarSimulado(simulado)}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                    >
                      Iniciar
                    </button>
                    {resultado && (
                      <button
                        onClick={() => handleResumoSimulado(simulado)}
                        className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-800 text-slate-200 hover:bg-gray-700 transition"
                      >
                        Progresso
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

