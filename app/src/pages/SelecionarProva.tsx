import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProvas } from "../services/supabaseService";
import { useExam } from "../contexts/ExamContext";
import type { Prova } from "../types/index";
import BasePage from '../components/BasePage';

export default function SelecionarProva() {
  const navigate = useNavigate();
  const { selectedExam, selectExam } = useExam();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provas, setProvas] = useState<Prova[]>([]);

  useEffect(() => {
    async function loadProvas() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await fetchProvas();
      if (fetchError) {
        console.error(fetchError);
        setError("Nao foi possivel carregar as provas.");
      } else {
        setProvas((data ?? []) as Prova[]);
      }
      setLoading(false);
    }
    loadProvas();
  }, []);

  const handleSelect = (prova: Prova) => {
    selectExam({
      id_prova: prova.id_prova,
      nome: prova.descricao || `Prova ${prova.id_prova}`,
      descricao: prova.descricao,
      tempo_por_questao: prova.tempo_por_questao ?? null,
    });
    navigate(`/simulado/${prova.id_prova}/-1`); // -1 para id_tema opcional, ajuste se necessário
  };

  return (
    <BasePage>
      <div className="glass-card p-6 sm:p-10">
        <h1 className="ds-heading text-center mb-6">Selecione a prova que deseja realizar</h1>

        {selectedExam ? (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-semibold">Prova selecionada atualmente:</p>
            <p>{selectedExam.nome}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <span
              className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mb-3"
              aria-label="Carregando"
            ></span>
            <p className="ds-muted text-center">Carregando provas...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-600" role="alert">
            {error}
          </p>
        ) : provas.length === 0 ? (
          <p className="ds-muted text-center">
            Nenhuma prova disponível no momento.
          </p>
        ) : (
          <ul className="space-y-4">
            {provas.map((prova) => (
              <li key={prova.id_prova}>
                <button
                  onClick={() => handleSelect(prova)}
                  className="w-full text-left rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:outline-none hover:border-blue-400 transition bg-white p-4 sm:p-5"
                  tabIndex={0}
                  aria-label={`Selecionar prova ${prova.descricao || prova.id_prova}`}
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-blue-700">
                    {prova.descricao || `Prova ${prova.id_prova}`}
                  </h2>
                  {prova.descricao ? (
                    <p className="text-gray-600 mt-1">{prova.descricao}</p>
                  ) : null}
                  {prova.tempo_por_questao ? (
                    <p className="text-sm text-gray-500 mt-2">
                      Tempo por questão: {prova.tempo_por_questao} segundos
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BasePage>
  );
}
