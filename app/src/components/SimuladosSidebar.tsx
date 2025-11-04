import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buscarSimuladosDisponveis } from "../services/questoesService";
import { supabase } from "../lib/supabaseClient";
import { ensureUsuarioRegistro } from "../services/supabaseService";

interface Simulado {
  id_simulado: number;
  nome: string;
  descricao?: string;
  data_criacao?: string;
  simulado_questoes?: Array<{ count: number }>;
}

interface ResultadoSimulado {
  id_usuario: number;
  id_simulado: number;
  percentual: number;
};

interface SimuladosSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SimuladosSidebar({ isOpen = true, onClose }: SimuladosSidebarProps) {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<SimuladoDoEnem[]>([]);
  const [resultados, setResultados] = useState<Map<number, ResultadoSimulado>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(!isOpen);

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
        setError('Usuário não autenticado');
        return;
      }

        // Garantir registro do usuário
        const perfil = await ensureUsuarioRegistro(user);
        setUserId(perfil.id_usuario);

        // Carregar simulados
        const simuladosData = await buscarSimuladosDisponveis();
        setSimulados((simuladosData ?? []) as Simulado[]);

        // Carregar resultados do usuário
        if (perfil.id_usuario) {
          const { data: resultadosData } = await supabase
            .from("resultados_simulados")
            .select("*")
            .eq("id_usuario", perfil.id_usuario);

          const resultadosMap = new Map<number, ResultadoSimulado>();
          (resultadosData ?? []).forEach((r: ResultadoSimulado) => {
            resultadosMap.set(r.id_simulado, r);
          });
          setResultados(resultadosMap);
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao buscar simulados");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleIniciarSimulado = (simulado: SimuladoDoEnem) => {
    navigate(`/resolver-simulado/${simulado.id_prova}`);
    onClose?.();
  };

  const handleRefazerSimulado = (simulado: Simulado) => {
    navigate(`/resolver-simulado/${simulado.id_simulado}`);
    onClose?.();
  };

  const handleVerResultado = (simulado: Simulado) => {
    // Navegar para página de resultado (poderia ser um modal ou página separada)
    const resultado = resultados.get(simulado.id_simulado);
    if (resultado) {
      alert(`Resultado: ${resultado.percentual}% - ${new Date(resultado.data_conclusao).toLocaleDateString('pt-BR')}`);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 z-40 overflow-y-auto ${
        collapsed ? 'w-20' : 'w-80'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && <h2 className="text-lg font-bold text-blue-400 truncate">Simulados</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
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

        {/* Content */}
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">
              {error}
            </div>
          ) : simulados.length === 0 ? (
            <div className="text-gray-400 text-sm p-3 text-center">
              Nenhum simulado disponível
            </div>
          ) : (
            <div className="space-y-2">
              {simulados.map((simulado) => {
                const resultado = resultados.get(simulado.id_simulado);
                const temResultado = !!resultado;
                
                return (
                  <div
                    key={simulado.id_simulado}
                    className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-blue-600 transition"
                  >
                    {collapsed ? (
                      <div className="text-xs font-bold text-center truncate">
                        {simulado.nome.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-sm text-blue-300 truncate mb-1">
                          {simulado.nome}
                        </div>
                        {simulado.descricao && (
                          <div className="text-xs text-gray-400 truncate mb-2">
                            {simulado.descricao}
                          </div>
                        )}
                        
                        {/* Status */}
                        {temResultado && (
                          <div className="mb-2 p-2 bg-green-900/20 rounded border border-green-700/30">
                            <div className="text-xs text-green-300 font-semibold">
                              ✓ Respondido: {resultado.percentual}%
                            </div>
                            <div className="text-xs text-green-400">
                              {new Date(resultado.data_conclusao).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleIniciarSimulado(simulado)}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                  >
                    Iniciar
                  </button>
                  {resultado && (
                    <button
                      onClick={() => handleVerResumo(simulado)}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-800 text-slate-200 hover:bg-gray-700 transition"
                    >
                      Progresso
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
