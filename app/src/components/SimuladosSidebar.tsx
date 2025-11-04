import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarSimuladosDisponveis } from '../services/questoesService';
import { supabase } from '../lib/supabaseClient';
import { ensureUsuarioRegistro } from '../services/supabaseService';

type Simulado = {
  id_simulado: number;
  id_prova: number;
  nome: string;
  descricao?: string | null;
  total_questoes: number;
};

type ResultadoSimulado = {
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
  const [simulados, setSimulados] = useState<Simulado[]>([]);
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

      const perfil = await ensureUsuarioRegistro(user);

      const simuladosDisponiveis = await buscarSimuladosDisponveis();
      const simuladosFormatados: Simulado[] = simuladosDisponiveis.map((sim) => ({
        id_simulado: sim.id_simulado,
        id_prova: sim.id_prova,
        nome: sim.nome,
        descricao: sim.descricao,
        total_questoes: sim.total_questoes,
      }));

      setSimulados(simuladosFormatados);

      const { data: respostasData, error: erroRespostas } = await supabase
        .from('respostas_usuarios')
        .select('id_questao, correta, questoes:questoes(id_prova)')
        .eq('id_usuario', perfil.id_usuario);

      if (erroRespostas) {
        console.error('Erro ao buscar respostas do usuário:', erroRespostas);
        return;
      }

      const agregados = new Map<number, ResultadoSimulado>();

      (respostasData ?? []).forEach((linha: any) => {
        const idProva = linha.questoes?.id_prova;
        if (!idProva) return;

        const bucket = agregados.get(idProva) ?? {
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
        const percentual = bucket.total_respondidas
          ? (bucket.total_acertos / bucket.total_respondidas) * 100
          : 0;

        agregados.set(idProva, { ...bucket, percentual: Number(percentual.toFixed(2)) });
      });

      setResultados(
        new Map(
          Array.from(agregados.entries()).map(([idProva, resultado]) => [
            idProva,
            resultado,
          ])
        )
      );
    } catch (err) {
      console.error('Erro ao carregar simulados:', err);
      setError('Erro ao buscar simulados');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarSimulado = (simulado: Simulado) => {
    navigate(`/resolver-simulado/${simulado.id_simulado}`);
    onClose?.();
  };

  const handleVerResumo = (simulado: Simulado) => {
    const resultado = resultados.get(simulado.id_prova);
    if (!resultado) return;

    alert(
      `Simulado: ${simulado.nome}\n` +
        `Questões respondidas: ${resultado.total_respondidas}/${simulado.total_questoes}\n` +
        `Acertos: ${resultado.total_acertos}\n` +
        `Aproveitamento: ${resultado.percentual.toFixed(1)}%`
    );
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

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400 text-center">Carregando simulados...</p>
        ) : error ? (
          <p className="text-sm text-red-400 text-center">{error}</p>
        ) : simulados.length === 0 ? (
          <p className="text-sm text-slate-400 text-center">Nenhum simulado disponível</p>
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
                className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3"
              >
                <div>
                  <p className="font-semibold text-slate-100 leading-tight">{simulado.nome}</p>
                  {simulado.descricao && (
                    <p className="text-xs text-slate-400 mt-1">{simulado.descricao}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{simulado.total_questoes} questões</span>
                  <span>{progresso.toFixed(0)}% concluído</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${progresso}%` }}
                  />
                </div>

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
