import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProvas } from "../services/supabaseService";
import { useExam } from "../contexts/ExamContext";
import type { Prova } from "../types/index";

interface SimuladosSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SimuladosSidebar({ isOpen = true, onClose }: SimuladosSidebarProps) {
  const navigate = useNavigate();
  const { selectedExam, selectExam } = useExam();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(!isOpen);

  useEffect(() => {
    const carregarProvas = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await fetchProvas();
        if (fetchError) {
          console.error("Erro ao carregar provas:", fetchError);
          setError("Erro ao carregar provas");
        } else {
          setProvas((data ?? []) as Prova[]);
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao buscar provas");
      } finally {
        setLoading(false);
      }
    };

    carregarProvas();
  }, []);

  const handleSelectSimulado = (prova: Prova) => {
    selectExam({
      id_prova: prova.id_prova,
      nome: prova.nome,
      descricao: prova.descricao,
      tempo_por_questao: prova.tempo_por_questao ?? null,
    });
    navigate(`/simulado/${prova.id_prova}/-1`);
    onClose?.();
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
          ) : provas.length === 0 ? (
            <div className="text-gray-400 text-sm p-3 text-center">
              Nenhum simulado disponível
            </div>
          ) : (
            <div className="space-y-1">
              {provas.map((prova) => (
                <button
                  key={prova.id_prova}
                  onClick={() => handleSelectSimulado(prova)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedExam?.id_prova === prova.id_prova
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  title={collapsed ? prova.nome : undefined}
                >
                  {collapsed ? (
                    <div className="text-xs font-bold text-center">
                      {prova.nome.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold text-sm truncate">
                        {prova.nome}
                      </div>
                      {prova.descricao && (
                        <div className="text-xs text-gray-400 truncate">
                          {prova.descricao}
                        </div>
                      )}
                      {prova.tempo_por_questao && (
                        <div className="text-xs text-gray-500 mt-1">
                          ⏱️ {prova.tempo_por_questao}s por questão
                        </div>
                      )}
                    </>
                  )}
                </button>
              ))}
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
