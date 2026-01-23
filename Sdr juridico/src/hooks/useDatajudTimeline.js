import { useCallback, useState } from "react";
import { datajudTimelineService } from "@/services/datajudTimelineService";
const toIsoDate = (value) => {
  if (!value)
    return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return null;
  return date.toISOString();
};
const buildProcessTitle = (processo) => {
  return `Processo ${processo.numero_processo || processo.id}`;
};
const buildProcessDescription = (processo) => {
  const parts = [];
  if (processo.tribunal)
    parts.push(`Tribunal: ${processo.tribunal}`);
  if (processo.classe)
    parts.push(`Classe: ${processo.classe}`);
  if (processo.area)
    parts.push(`Area: ${processo.area}`);
  return parts.join(" | ") || "Processo importado do DataJud.";
};
const buildMovimentacaoTitle = (mov) => {
  const base = mov.descricao?.trim();
  if (base)
    return base;
  if (mov.codigo)
    return `Movimentacao ${mov.codigo}`;
  return "Movimentacao registrada";
};
const buildMovimentacaoDescription = (processo) => {
  if (!processo)
    return "Movimentacao do DataJud.";
  return `Processo ${processo.numero_processo || processo.id}`;
};
export function useDatajudTimeline() {
  const [state, setState] = useState({
    eventos: [],
    loading: false,
    error: null
  });
  const fetchByCaso = useCallback(async (casoId) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const processos = await datajudTimelineService.getProcessosByCaso(casoId);
      const processoMap = new Map(processos.map((processo) => [processo.id, processo]));
      const movimentacoes = await datajudTimelineService.getMovimentacoesByProcessos(
        Array.from(processoMap.keys())
      );
      const processoEvents = processos.map((processo) => ({
        id: `datajud-processo-${processo.id}`,
        casoId: casoId,
        title: buildProcessTitle(processo),
        category: "juridico",
        channel: "DataJud",
        date: toIsoDate(processo.last_sync_at || processo.created_at) || new Date().toISOString(),
        description: buildProcessDescription(processo),
        tags: ["datajud", "processo"],
        author: "Sistema"
      }));
      const movimentacaoEvents = movimentacoes.map((movimentacao) => {
        const processo = processoMap.get(movimentacao.processo_id);
        return {
          id: `datajud-mov-${movimentacao.id}`,
          casoId: casoId,
          title: buildMovimentacaoTitle(movimentacao),
          category: "juridico",
          channel: "DataJud",
          date: toIsoDate(movimentacao.data_movimentacao || movimentacao.created_at) || new Date().toISOString(),
          description: buildMovimentacaoDescription(processo),
          tags: ["datajud", "movimentacao"],
          author: "Sistema"
        };
      });
      const eventos = [...processoEvents, ...movimentacaoEvents];
      setState((prev) => ({ ...prev, eventos, loading: false }));
      return eventos;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Erro desconhecido");
      setState((prev) => ({ ...prev, error: err, loading: false }));
      throw err;
    }
  }, []);
  return {
    ...state,
    fetchByCaso
  };
}
