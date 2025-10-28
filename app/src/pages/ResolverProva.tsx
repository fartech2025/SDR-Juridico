import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Instância única do Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ResolverProva() {
  const { ano } = useParams();
  const navigate = useNavigate();
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(19800); // 5h30min
  const [respostas, setRespostas] = useState<Record<number, boolean | null>>({});
  const [selecionadas, setSelecionadas] = useState<Record<number, number | null>>({});
  const userId = Number(import.meta.env.VITE_USER_ID || 1);

  // ----------------- TIMER DIGITAL -----------------
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoRestante((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    if (tempoRestante === 0) finalizarProva();
    return () => clearInterval(interval);
  }, [tempoRestante]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // ----------------- CARREGAR QUESTÕES -----------------
  useEffect(() => {
    const carregar = async () => {
      if (!ano) return;

      // Busca a prova pelo ano
      const { data: prova } = await supabase
        .from("provas")
        .select("id_prova")
        .eq("ano", parseInt(ano))
        .single();

      if (!prova) {
        console.error("Prova não encontrada para o ano:", ano);
        return;
      }

      // Busca as questões da prova
      const { data: qs, error } = await supabase
        .from("questoes")
        .select("*")
        .eq("id_prova", prova.id_prova);

      if (error) {
        console.error("Erro ao buscar questões:", error);
        return;
      }

      if (!qs?.length) {
        console.warn("Nenhuma questão encontrada para esta prova.");
        return;
      }

      // Busca alternativas e imagens relacionadas
      const qIds = qs.map((q) => q.id_questao);
      const { data: alts } = await supabase
        .from("alternativas")
        .select("id_alternativa,id_questao,letra,texto,correta")
        .in("id_questao", qIds);

      const { data: imgs } = await supabase
        .from("imagens")
        .select("tipo_entidade,id_entidade,caminho_arquivo")
        .in("id_entidade", qIds)
        .in("tipo_entidade", ["questao", "alternativa"]);

      const fullQuestoes = qs.map((q) => {
        const alternativas = alts
          ?.filter((a) => a.id_questao === q.id_questao)
          .map((a) => {
            const imgAlt = imgs?.find(
              (i) =>
                i.tipo_entidade === "alternativa" &&
                i.id_entidade === a.id_alternativa
            );
            return {
              ...a,
              imagem: imgAlt ? imgAlt.caminho_arquivo : null,
            };
          });
        const imgQ = imgs?.find(
          (i) =>
            i.tipo_entidade === "questao" && i.id_entidade === q.id_questao
        );
        return {
          ...q,
          enunciadoImagem: imgQ ? imgQ.caminho_arquivo : null,
          alternativas,
        };
      });

      setQuestoes(fullQuestoes);
    };

    carregar();
  }, [ano]);

  // ----------------- FINALIZAR PROVA -----------------
  const finalizarProva = () => {
    navigate("/provas");
  };

  // ----------------- SE CARREGANDO -----------------
  if (!questoes.length)
    return (
      <div className="p-6 text-slate-300">Carregando questões...</div>
    );

  // Proteção contra índice inválido
  const safeIndex = Math.min(index, questoes.length - 1);
  const current = questoes[safeIndex];

  // ----------------- REGISTRAR RESPOSTA -----------------
  const responder = async (idAlternativa: number) => {
    const inicio = Date.now();
    const alt = current.alternativas.find(
      (a: any) => a.id_alternativa === idAlternativa
    );

    const { data: correta } = await supabase
      .from("alternativas")
      .select("correta")
      .eq("id_alternativa", idAlternativa)
      .single();

    const acertou = correta?.correta ?? false;

    await supabase.from("respostas_usuarios").upsert({
      id_usuario: userId,
      id_questao: current.id_questao,
      id_alternativa: idAlternativa,
      alternativa_marcada: alt.letra,
      correta: acertou,
      tempo_resposta_ms: Date.now() - inicio,
    });

    // Atualiza estados locais
    setRespostas((prev) => ({ ...prev, [current.id_questao]: acertou }));
    setSelecionadas((prev) => ({ ...prev, [current.id_questao]: idAlternativa }));

    // Avança automaticamente após leve pausa
    setTimeout(() => {
      if (safeIndex < questoes.length - 1) setIndex((i) => i + 1);
      else finalizarProva();
    }, 800);
  };

  // ----------------- RENDERIZAÇÃO -----------------
  return (
    <div className="p-6 grid grid-cols-[300px_1fr] gap-6">
      {/* Lateral numerada */}
      <div className="bg-slate-900/70 rounded-xl p-3 overflow-y-auto h-[calc(100vh-100px)] border border-slate-800">
        <div className="grid grid-cols-5 gap-2">
          {questoes.map((q, i) => {
            const resp = respostas[q.id_questao];
            const bg =
              resp === true
                ? "bg-green-600"
                : resp === false
                ? "bg-red-600"
                : "bg-slate-800";
            return (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`py-2 rounded-md text-sm font-medium ${bg} ${
                  safeIndex === i ? "ring-2 ring-blue-400" : ""
                } text-white`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questão atual */}
      <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Prova ENEM {ano}
          </h2>
          <div className="text-blue-400 font-mono">
            {formatTime(tempoRestante)}
          </div>
        </div>

        <h3 className="text-slate-200 mb-3">
          Questão {safeIndex + 1} de {questoes.length}
        </h3>

        {/* Enunciado */}
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 mb-5">
          <p className="whitespace-pre-wrap text-slate-100">
            {current.enunciado}
          </p>

          {current.enunciado?.match(/\.(png|jpg|jpeg|gif|webp)$/i) && (
            <img
              src={current.enunciado}
              alt="Imagem da questão"
              className="mt-3 max-w-full rounded-lg border border-slate-700 shadow-md"
            />
          )}

          {current.enunciadoImagem && (
            <img
              src={current.enunciadoImagem}
              alt="Imagem da questão"
              className="mt-3 max-w-full rounded-lg border border-slate-700 shadow-md"
            />
          )}
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {current.alternativas?.map((a: any) => {
            const isImageText = a.texto?.match(/\.(png|jpg|jpeg|gif|webp)$/i);
            const imageUrl = isImageText ? a.texto : a.imagem;

            const foiRespondida = respostas[current.id_questao] !== undefined;
            const foiSelecionada = selecionadas[current.id_questao] === a.id_alternativa;

            let bg = "bg-slate-800/50 hover:bg-slate-700/50";
            if (foiRespondida && foiSelecionada) {
              bg = respostas[current.id_questao]
                ? "bg-green-600/70 border-green-500"
                : "bg-red-600/70 border-red-500";
            }

            return (
              <button
                key={a.id_alternativa}
                onClick={() => responder(a.id_alternativa)}
                disabled={foiRespondida}
                className={`text-left card p-4 rounded-lg border ${bg} transition`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-blue-300">
                      {a.letra}.
                    </span>
                    {!isImageText && (
                      <span className="text-sm text-slate-200">
                        {a.texto}
                      </span>
                    )}
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`Alternativa ${a.letra}`}
                      className="max-w-full rounded-md border border-slate-700 shadow-md"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navegação manual */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            className="btn"
          >
            <ArrowLeft size={16} /> Anterior
          </button>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setIndex((i) =>
                  i < questoes.length - 1 ? i + 1 : i
                )
              }
              className="btn"
            >
              Próxima <ArrowRight size={16} />
            </button>
          </div>
          <button
            onClick={finalizarProva}
            className="btn bg-blue-600 hover:bg-blue-700 text-white"
          >
            Finalizar Prova
          </button>
        </div>
      </div>
    </div>
  );
}
