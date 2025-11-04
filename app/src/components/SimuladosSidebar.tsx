import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SimuladosService, SimuladoDoEnem } from "../services/simuladosService";
import { supabase } from "../lib/supabaseClient";
import { ensureUsuarioRegistro } from "../services/supabaseService";

interface ResultadoSimulado {
  id_usuario: number;
  id_prova: number;
  percentual: number;
  data_conclusao: string;
}

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
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obter usuário autenticado
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          setError("Usuário não autenticado");
          setLoading(false);
          return;
        }

        // Garantir registro do usuário
        const perfil = await ensureUsuarioRegistro(user);
        setUserId(perfil.id_usuario);

        // ✅ NOVO: Carregar simulados via SimuladosService
        const simuladosData = await SimuladosService.listarSimulados();
        setSimulados(simuladosData);

        // Carregar resultados do usuário
        if (perfil.id_usuario) {
          const { data: resultadosData } = await supabase
            .from("resultados_simulados")
            .select("*")
            .eq("id_usuario", perfil.id_usuario);

          const resultadosMap = new Map<number, ResultadoSimulado>();
          (resultadosData ?? []).forEach((r: ResultadoSimulado) => {
            resultadosMap.set(r.id_prova, r);
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

  const handleRefazerSimulado = (simulado: SimuladoDoEnem) => {
    navigate(`/resolver-simulado/${simulado.id_prova}`);
    onClose?.();
  };

  const handleVerResultado = (simulado: SimuladoDoEnem) => {
    // Navegar para página de resultado (poderia ser um modal ou página separada)
    const resultado = resultados.get(simulado.id_prova);
    if (resultado) {
      alert(`Resultado: ${resultado.percentual}% - ${new Date(resultado.data_conclusao).toLocaleDateString('pt-BR')}`);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 z-40 overflow-y-auto ${
          collapsed ? "w-20" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!collapsed && (
            <h2 className="text-lg font-bold text-blue-400 truncate">Simulados</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200"
            aria-label={collapsed ? "Expandir" : "Recolher"}
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
                const resultado = resultados.get(simulado.id_prova);
                const temResultado = !!resultado;
                
                return (
                  <div
                    key={simulado.id_prova}
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

                        {/* Botões de Ação */}
                        <div className="flex gap-1 mt-2">
                          {!temResultado ? (
                            <button
                              onClick={() => handleIniciarSimulado(simulado)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition"
                              title="Iniciar simulado"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                              {!collapsed && "Iniciar"}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRefazerSimulado(simulado)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition"
                                title="Refazer simulado"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 5.414 1 1 0 11-1.414-1.414A5.002 5.002 0 104.659 6.1H7a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                {!collapsed && "Refazer"}
                              </button>
                              <button
                                onClick={() => handleVerResultado(simulado)}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition"
                                title="Ver resultado"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                {!collapsed && "Resultado"}
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gradient-to-t from-gray-950 to-transparent">
            <Link
              to="/"
              className="w-full block text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Voltar para Home
            </Link>
          </div>
        )}
      </div>

      {/* Overlay (mobile) */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Spacer para não sobrepor conteúdo */}
      <div className={`transition-all duration-300 ${collapsed ? "w-20" : "w-80"}`} />
    </>
  );
}
