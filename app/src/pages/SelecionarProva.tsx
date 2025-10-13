import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useExam } from "../contexts/ExamContext";

type ProvaRow = {
  id_prova: number;
  nome: string;
  descricao: string | null;
  tempo_por_questao: number | null;
};

export default function SelecionarProva() {
  const navigate = useNavigate();
  const { selectedExam, selectExam } = useExam();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provas, setProvas] = useState<ProvaRow[]>([]);

  useEffect(() => {
    async function fetchProvas() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("provas")
        .select("id_prova, nome, descricao, tempo_por_questao")
        .order("nome", { ascending: true });

      if (fetchError) {
        console.error(fetchError);
        setError("Nao foi possivel carregar as provas.");
      } else {
        setProvas((data ?? []) as ProvaRow[]);
      }
      setLoading(false);
    }

    fetchProvas();
  }, []);

  const handleSelect = (prova: ProvaRow) => {
    selectExam(prova);
    navigate("/questoes");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Selecione a prova que deseja realizar</h1>

        {selectedExam ? (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-semibold">Prova selecionada atualmente:</p>
            <p>{selectedExam.nome}</p>
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-gray-600">Carregando provas...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : provas.length === 0 ? (
          <p className="text-center text-gray-600">Nenhuma prova disponivel no momento.</p>
        ) : (
          <ul className="space-y-4">
            {provas.map((prova) => (
              <li key={prova.id_prova}>
                <button
                  onClick={() => handleSelect(prova)}
                  className="w-full text-left rounded-xl border border-blue-200 hover:border-blue-400 transition bg-white p-5"
                >
                  <h2 className="text-xl font-semibold text-blue-700">{prova.nome}</h2>
                  {prova.descricao ? <p className="text-gray-600 mt-1">{prova.descricao}</p> : null}
                  {prova.tempo_por_questao ? (
                    <p className="text-sm text-gray-500 mt-2">
                      Tempo por questao: {prova.tempo_por_questao} segundos
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
