import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Filter, Search, ShieldCheck } from "lucide-react";
import { PageState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditLogsService } from "@/services/auditLogsService";
import { formatDateTime } from "@/utils/format";
const actionLabel = (action) => {
  if (action === "create") return "Criado";
  if (action === "update") return "Atualizado";
  if (action === "delete") return "Removido";
  return action;
};
const actionVariant = (action) => {
  if (action === "create") return "success";
  if (action === "update") return "warning";
  if (action === "delete") return "danger";
  return "default";
};
const formatDetails = (details) => {
  if (!details) return "Sem detalhes";
  const fields = details.fields;
  if (Array.isArray(fields) && fields.length) {
    return `Campos: ${fields.join(", ")}`;
  }
  return "Detalhes disponiveis";
};
const entityOptions = [
  { label: "Todas", value: "todos" },
  { label: "Casos", value: "casos" },
  { label: "Clientes", value: "clientes" },
  { label: "Leads", value: "leads" },
  { label: "Tarefas", value: "tarefas" },
  { label: "Documentos", value: "documentos" },
  { label: "Agenda", value: "agendamentos" },
  { label: "Notas", value: "notas" },
  { label: "Auth", value: "auth" }
];
const AuditoriaPage = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("todos");
  const [entityFilter, setEntityFilter] = React.useState("todos");
  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trimmedSearch = searchTerm.trim();
      const data = await auditLogsService.getAuditLogs({
        action: actionFilter === "todos" ? null : actionFilter,
        entity: entityFilter === "todos" ? null : entityFilter,
        search: trimmedSearch || null
      });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar auditoria"));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, searchTerm]);
  React.useEffect(() => {
    fetchLogs().catch(() => null);
  }, [fetchLogs]);
  const pageState = loading ? "loading" : error ? "error" : logs.length ? "ready" : "empty";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-text", children: "Auditoria" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-text-subtle", children: "Acompanhe mudancas e acessos." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: fetchLogs, className: "h-9 rounded-full px-4", children: "Atualizar" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0", children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Filtros" }),
        /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 text-text-subtle" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-sm", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Buscar por entidade, usuario ou acao",
              className: "h-10 rounded-full border border-border bg-surface-2 pl-9 text-sm text-text",
              value: searchTerm,
              onChange: (event) => setSearchTerm(event.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            className: "h-10 rounded-full border border-border bg-white px-4 text-sm text-text shadow-soft",
            value: actionFilter,
            onChange: (event) => setActionFilter(event.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "todos", children: "Todas as acoes" }),
              /* @__PURE__ */ jsx("option", { value: "create", children: "Criacoes" }),
              /* @__PURE__ */ jsx("option", { value: "update", children: "Atualizacoes" }),
              /* @__PURE__ */ jsx("option", { value: "delete", children: "Remocoes" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "select",
          {
            className: "h-10 rounded-full border border-border bg-white px-4 text-sm text-text shadow-soft",
            value: entityFilter,
            onChange: (event) => setEntityFilter(event.target.value),
            children: entityOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(PageState, { status: pageState, children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      logs.map((log) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-2xl border border-border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(18,38,63,0.06)]",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 text-xs text-text-subtle", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: actionVariant(log.action), children: actionLabel(log.action) }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium text-text", children: [
                  log.entity || "entidade",
                  " ",
                  log.entity_id ? `#${log.entity_id}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { children: formatDateTime(log.created_at) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-text-subtle", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Usuario: ",
                log.actor_user_id || "sistema"
              ] }),
              /* @__PURE__ */ jsx("span", { children: "-" }),
              /* @__PURE__ */ jsx("span", { children: formatDetails(log.details) })
            ] })
          ]
        },
        log.id
      )),
      logs.length === 0 && !loading && !error && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-text-muted shadow-soft", children: "Nenhum evento encontrado para os filtros atuais." })
    ] }) })
  ] });
};
export {
  AuditoriaPage
};
