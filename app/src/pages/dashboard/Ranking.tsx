import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type RankingLinha = {
  nome: string;
  percentual: number;
  total_questoes: number;
};

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingLinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarRanking() {
      setLoading(true);
      setErro(null);
      try {
        const [{ data: resultados, error: rankingError }, { data: usuarios, error: usuariosError }] = await Promise.all([
          supabase
            .from('resultados_usuarios')
            .select('id_usuario, percentual_acertos, total_questoes')
            .order('percentual_acertos', { ascending: false })
            .limit(20),
          supabase.from('usuarios').select('id_usuario, nome, email'),
        ]);

        if (rankingError) {
          throw rankingError;
        }
        if (usuariosError) {
          throw usuariosError;
        }

        const linhas: RankingLinha[] =
          resultados?.map((linha) => {
            const usuario = usuarios?.find((u) => u.id_usuario === linha.id_usuario);
            return {
              nome: usuario?.nome || usuario?.email || `Usuário #${linha.id_usuario}`,
              percentual: Number(linha.percentual_acertos ?? 0),
              total_questoes: Number(linha.total_questoes ?? 0),
            };
          }) ?? [];

        setRanking(linhas);
      } catch (error) {
        console.error('Erro ao carregar ranking', error);
        setErro('Não foi possível carregar o ranking no momento.');
      } finally {
        setLoading(false);
      }
    }

    carregarRanking();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-2 sm:p-10 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-blue-400">🏆 Ranking</h1>

        <div className="bg-gray-900 p-4 sm:p-8 rounded-3xl shadow-xl">
          {loading ? (
            <p className="text-center text-gray-400">Carregando ranking...</p>
          ) : erro ? (
            <p className="text-center text-red-400" role="alert">
              {erro}
            </p>
          ) : ranking.length === 0 ? (
            <p className="text-center text-gray-400">Ainda não há resultados suficientes para montar o ranking.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <th className="p-3">Posição</th>
                    <th className="p-3">Aluno</th>
                    <th className="p-3">Aproveitamento</th>
                    <th className="p-3">Questões respondidas</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((linha, index) => (
                    <tr key={linha.nome + index} className="border-t border-gray-800 hover:bg-gray-800/40">
                      <td className="p-3 font-semibold text-blue-300">#{index + 1}</td>
                      <td className="p-3">{linha.nome}</td>
                      <td className="p-3">{linha.percentual.toFixed(2)}%</td>
                      <td className="p-3">{linha.total_questoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
