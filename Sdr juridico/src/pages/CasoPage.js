import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  Filter,
  FileText,
  KeyRound,
  Search,
  ShieldCheck
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import heroLight from "@/assets/hero-light.svg";
import { PageState } from "@/components/PageState";
import { Timeline } from "@/components/Timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import { useCasos } from "@/hooks/useCasos";
import { useLeads } from "@/hooks/useLeads";
import { useDocumentos } from "@/hooks/useDocumentos";
import { useNotas } from "@/hooks/useNotas";
import { useAgenda } from "@/hooks/useAgenda";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTarefas } from "@/hooks/useTarefas";
import { useDatajudTimeline } from "@/hooks/useDatajudTimeline";
const resolveStatus = (value) => {
  if (value === "loading" || value === "empty" || value === "error") {
    return value;
  }
  return "ready";
};
const tabs = [
  "Tudo",
  "Documentos",
  "Agenda",
  "Tarefas",
  "Comercial",
  "Juridico",
  "Automacao",
  "Humano"
];
const CHECKLIST_PREFIX = "[Checklist] ";
const categoryMap = {
  Tudo: null,
  Documentos: "docs",
  Agenda: "agenda",
  Tarefas: null,
  Comercial: "comercial",
  Juridico: "juridico",
  Automacao: "automacao",
  Humano: "humano"
};
const eventCategoryOptions = [
  { label: "Docs", value: "docs" },
  { label: "Agenda", value: "agenda" },
  { label: "Comercial", value: "comercial" },
  { label: "Juridico", value: "juridico" },
  { label: "Automacao", value: "automacao" },
  { label: "Humano", value: "humano" }
];
const statusBadge = (status) => {
  if (status === "encerrado") return "danger";
  if (status === "suspenso") return "warning";
  return "success";
};
const normalizeChecklistTitle = (title) => {
  const trimmed = title.trim();
  if (trimmed.startsWith(CHECKLIST_PREFIX)) {
    return trimmed.slice(CHECKLIST_PREFIX.length).trim();
  }
  return trimmed;
};
const buildChecklistTitle = (title) => {
  const trimmed = title.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(CHECKLIST_PREFIX)) return trimmed;
  return `${CHECKLIST_PREFIX}${trimmed}`;
};
const toDateInput = (value) => value ? value.slice(0, 10) : "";
const taskStatusPill = (status) => {
  if (status === "concluida") return "border-success-border bg-success-bg text-success";
  if (status === "em_progresso") return "border-warning-border bg-warning-bg text-warning";
  return "border-border bg-surface-2 text-text-muted";
};
const taskPriorityPill = (priority) => {
  if (priority === "alta") return "border-danger-border bg-danger-bg text-danger";
  if (priority === "normal") return "border-info-border bg-info-bg text-info";
  return "border-border bg-surface-2 text-text-muted";
};
const CasoPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { casos, loading: casosLoading, error: casosError } = useCasos();
  const { leads, loading: leadsLoading, error: leadsError } = useLeads();
  const { documentos, loading: docsLoading, error: docsError, fetchByCaso } = useDocumentos();
  const { eventos: agendaItems, loading: agendaLoading, error: agendaError } = useAgenda();
  const {
    notas,
    loading: notasLoading,
    error: notasError,
    fetchNotasByEntidade,
    createNota
  } = useNotas();
  const {
    tarefas,
    loading: tarefasLoading,
    error: tarefasError,
    fetchTarefasByEntidade,
    createTarefa,
    updateTarefa,
    deleteTarefa
  } = useTarefas();
  const {
    eventos: datajudEvents,
    loading: datajudLoading,
    error: datajudError,
    fetchByCaso: fetchDatajudByCaso
  } = useDatajudTimeline();
  const { displayName, user } = useCurrentUser();
  const status = resolveStatus(params.get("state"));
  const [activeTab, setActiveTab] = React.useState("Tudo");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState("all");
  const [sortOrder, setSortOrder] = React.useState("recent");
  const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false);
  const [taskDrawerMode, setTaskDrawerMode] = React.useState("create");
  const [taskDrawerTask, setTaskDrawerTask] = React.useState(null);
  const [taskDrawerForm, setTaskDrawerForm] = React.useState({
    title: "",
    description: "",
    status: "pendente",
    priority: "normal",
    dueDate: ""
  });
  const [taskDrawerError, setTaskDrawerError] = React.useState(null);
  const [taskDrawerSaving, setTaskDrawerSaving] = React.useState(false);
  const [eventForm, setEventForm] = React.useState({
    title: "",
    category: "juridico",
    description: ""
  });
  const [eventError, setEventError] = React.useState(null);
  const [eventSaving, setEventSaving] = React.useState(false);
  const timelineRef = React.useRef(null);
  const fallbackCaso = {
    id: "caso-sem-dados",
    title: "Sem caso",
    cliente: "Sem cliente",
    area: "Geral",
    status: "ativo",
    heat: "morno",
    stage: "triagem",
    value: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    tags: [],
    slaRisk: "ok"
  };
  const caso = casos.find((item) => item.id === id) ?? casos[0] ?? fallbackCaso;
  const lead = leads.find((item) => item.id === caso?.leadId);
  const caseDocs = React.useMemo(
    () => documentos.filter((doc) => doc.casoId === caso?.id),
    [documentos, caso?.id]
  );
  const caseAgenda = React.useMemo(
    () => agendaItems.filter((event) => event.casoId === caso?.id),
    [agendaItems, caso?.id]
  );
  const caseNotas = React.useMemo(
    () => notas.filter((event) => event.casoId === caso?.id),
    [notas, caso?.id]
  );
  const recentNotas = React.useMemo(() => {
    return [...caseNotas].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [caseNotas]);
  const caseTasks = React.useMemo(
    () => tarefas.filter((task) => task.casoId === caso?.id),
    [tarefas, caso?.id]
  );
  const checklistItems = React.useMemo(
    () => caseTasks.filter((task) => {
      const hasPrefix = task.title.trim().startsWith(CHECKLIST_PREFIX);
      return hasPrefix;
    }).map((task) => ({
      id: task.id,
      label: normalizeChecklistTitle(task.title),
      status: task.status === "concluida" ? "ok" : "pendente",
      task
    })),
    [caseTasks]
  );
  const docEvents = React.useMemo(
    () => caseDocs.map((doc) => ({
      id: `doc-${doc.id}`,
      casoId: doc.casoId || caso.id,
      title: doc.title,
      category: "docs",
      channel: "Documentos",
      date: doc.updatedAt || doc.createdAt,
      description: `${doc.type} - ${doc.status}`,
      tags: doc.tags || [],
      author: doc.requestedBy || "Sistema"
    })),
    [caseDocs, caso.id]
  );
  const agendaEvents = React.useMemo(
    () => caseAgenda.map((event) => ({
      id: `agenda-${event.id}`,
      casoId: event.casoId || caso.id,
      title: event.title,
      category: "agenda",
      channel: event.type || "Agenda",
      date: (/* @__PURE__ */ new Date(`${event.date}T${event.time}:00`)).toISOString(),
      description: `${event.time} - ${event.location || "Sem local"}`,
      tags: [],
      author: event.owner || "Sistema"
    })),
    [caseAgenda, caso.id]
  );
  const caseEvents = React.useMemo(() => {
    const combined = [...caseNotas, ...docEvents, ...agendaEvents, ...datajudEvents];
    if (user?.id && displayName) {
      return combined.map(
        (event) => event.author === user.id ? { ...event, author: displayName } : event
      );
    }
    return combined;
  }, [caseNotas, docEvents, agendaEvents, datajudEvents, user?.id, displayName]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const timelineEvents = React.useMemo(() => {
    let events = caseEvents;
    if (normalizedSearch) {
      events = events.filter((event) => {
        const haystack = [
          event.title,
          event.description,
          event.author,
          event.channel,
          event.category,
          ...event.tags || []
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }
    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 0;
      if (days > 0) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1e3;
        events = events.filter((event) => {
          const eventTime = new Date(event.date).getTime();
          return Number.isNaN(eventTime) ? false : eventTime >= cutoff;
        });
      }
    }
    const sorted = [...events].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return sortOrder === "recent" ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  }, [caseEvents, normalizedSearch, dateRange, sortOrder]);
  const filteredEvents = React.useMemo(() => {
    const category = categoryMap[activeTab];
    if (!category) return timelineEvents;
    return timelineEvents.filter((event) => event.category === category);
  }, [timelineEvents, activeTab]);
  React.useEffect(() => {
    const targetCaseId = id || caso.id;
    if (!targetCaseId) return;
    fetchNotasByEntidade("caso", targetCaseId).catch(() => null);
  }, [id, caso.id, fetchNotasByEntidade]);
  React.useEffect(() => {
    const targetCaseId = id || caso.id;
    if (!targetCaseId) return;
    fetchByCaso(targetCaseId).catch(() => null);
  }, [id, caso.id, fetchByCaso]);
  React.useEffect(() => {
    const targetCaseId = id || caso.id;
    if (!targetCaseId) return;
    fetchTarefasByEntidade("caso", targetCaseId).catch(() => null);
  }, [id, caso.id, fetchTarefasByEntidade]);
  React.useEffect(() => {
    const targetCaseId = id || caso.id;
    if (!targetCaseId) return;
    fetchDatajudByCaso(targetCaseId).catch(() => null);
  }, [id, caso.id, fetchDatajudByCaso]);
  const baseState = casosLoading || leadsLoading || docsLoading || agendaLoading || notasLoading || tarefasLoading || datajudLoading ? "loading" : casosError || leadsError || docsError || agendaError || notasError || tarefasError || datajudError ? "error" : casos.length ? "ready" : "empty";
  const pageState = status !== "ready" ? status : baseState;
  const highlights = [
    {
      id: "high-1",
      label: "Resumo gerado por IA",
      content: "Carlos Martins, ex-empregado da ACME Ltda, solicitou revisao de horas extras e verbas rescisorias."
    },
    {
      id: "high-2",
      label: "Pontos relevantes",
      content: "Testemunha chave Joao Silva mencionada na ultima conversa; pagamento de horas extras em aberto."
    }
  ];
  const resetFilters = () => {
    setDateRange("all");
    setSortOrder("recent");
  };
  const resetEventForm = () => {
    setEventForm({
      title: "",
      category: "juridico",
      description: ""
    });
    setEventError(null);
  };
  const resetTaskDrawerForm = () => {
    setTaskDrawerTask(null);
    setTaskDrawerMode("create");
    setTaskDrawerForm({
      title: "",
      description: "",
      status: "pendente",
      priority: "normal",
      dueDate: ""
    });
    setTaskDrawerError(null);
  };
  const openChecklistDrawer = (task) => {
    setTaskDrawerTask(task);
    setTaskDrawerMode("edit");
    setTaskDrawerForm({
      title: normalizeChecklistTitle(task.title),
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: toDateInput(task.dueDate)
    });
    setTaskDrawerError(null);
    setTaskDrawerOpen(true);
  };
  const openChecklistDrawerForCreate = () => {
    setTaskDrawerTask(null);
    setTaskDrawerMode("create");
    setTaskDrawerForm({
      title: "",
      description: "",
      status: "pendente",
      priority: "normal",
      dueDate: ""
    });
    setTaskDrawerError(null);
    setTaskDrawerOpen(true);
  };
  const openModal = () => {
    resetEventForm();
    setModalOpen(true);
  };
  const closeModal = () => {
    if (eventSaving) return;
    setModalOpen(false);
    resetEventForm();
  };
  const closeTaskDrawer = () => {
    if (taskDrawerSaving) return;
    setTaskDrawerOpen(false);
    resetTaskDrawerForm();
  };
  React.useEffect(() => {
    if (!taskDrawerOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeTaskDrawer();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [taskDrawerOpen, closeTaskDrawer]);
  const handleScrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleSaveEvent = async () => {
    if (!caso?.id) {
      setEventError("Caso nao encontrado.");
      return;
    }
    const title = eventForm.title.trim();
    if (!title) {
      setEventError("Informe um titulo para o evento.");
      return;
    }
    setEventSaving(true);
    setEventError(null);
    try {
      const description = eventForm.description.trim();
      const texto = description ? `${title}

${description}` : title;
      await createNota({
        entidade: "caso",
        entidadeId: caso.id,
        texto,
        createdBy: user?.id || null,
        tags: [eventForm.category]
      });
      setModalOpen(false);
      resetEventForm();
    } catch (error) {
      setEventError(error instanceof Error ? error.message : "Erro ao salvar evento");
    } finally {
      setEventSaving(false);
    }
  };
  const handleSaveTaskDrawer = async () => {
    const title = buildChecklistTitle(taskDrawerForm.title);
    if (!title) {
      setTaskDrawerError("Informe o titulo da tarefa.");
      return;
    }
    setTaskDrawerSaving(true);
    setTaskDrawerError(null);
    try {
      if (taskDrawerMode === "create") {
        if (!caso?.id) {
          setTaskDrawerError("Caso nao encontrado.");
          return;
        }
        await createTarefa({
          title,
          description: taskDrawerForm.description.trim() || null,
          priority: taskDrawerForm.priority,
          status: taskDrawerForm.status,
          dueDate: taskDrawerForm.dueDate || null,
          casoId: caso.id
        });
      } else if (taskDrawerTask) {
        const completedAt = taskDrawerForm.status === "concluida" ? taskDrawerTask.completedAt || (/* @__PURE__ */ new Date()).toISOString() : null;
        await updateTarefa(taskDrawerTask.id, {
          title,
          description: taskDrawerForm.description.trim() || null,
          priority: taskDrawerForm.priority,
          status: taskDrawerForm.status,
          dueDate: taskDrawerForm.dueDate || null,
          completedAt
        });
      }
      setTaskDrawerOpen(false);
      resetTaskDrawerForm();
    } catch (error) {
      setTaskDrawerError(error instanceof Error ? error.message : "Erro ao salvar tarefa");
    } finally {
      setTaskDrawerSaving(false);
    }
  };
  const handleDeleteChecklist = async (id2) => {
    const confirmed = window.confirm("Excluir esta tarefa?");
    if (!confirmed) return;
    try {
      await deleteTarefa(id2);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Erro ao excluir tarefa");
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base pb-12 text-text", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt p-6 shadow-card", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-no-repeat bg-right bg-[length:520px] opacity-80",
          style: { backgroundImage: `url(${heroLight})` }
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-text-muted shadow-soft",
            children: [
              /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }),
              "#",
              caso.id.replace("caso-", "")
            ]
          }
        ),
        /* @__PURE__ */ jsxs("h2", { className: "font-display text-2xl text-text", children: [
          caso.id.replace("caso-", "#"),
          " - ",
          caso.cliente
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-text-muted", children: [
          /* @__PURE__ */ jsx(Badge, { variant: statusBadge(caso.status), className: "capitalize", children: caso.status }),
          /* @__PURE__ */ jsx(Badge, { variant: "info", children: caso.area }),
          /* @__PURE__ */ jsx(Badge, { variant: "default", children: caso.stage })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(PageState, { status: pageState, children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[2.4fr_1fr]", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: tabs.map((tab) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab(tab),
            className: cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition",
              activeTab === tab ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-600" : "border-border bg-white text-text-muted hover:bg-surface-2 hover:text-text"
            ),
            children: tab
          },
          tab
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Buscar eventos...",
                className: "h-11 rounded-full border border-border bg-surface-2 pl-11 text-text placeholder:text-text-subtle focus:border-emerald-400 focus:ring-emerald-200",
                value: searchTerm,
                onChange: (event) => setSearchTerm(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "h-11 rounded-full px-4",
              onClick: () => setFiltersOpen((prev) => !prev),
              children: [
                /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4" }),
                "Filtros"
              ]
            }
          )
        ] }),
        filtersOpen && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text shadow-soft", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-subtle", children: "Periodo" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                className: "h-9 rounded-full border border-border bg-surface px-3 text-xs text-text shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200",
                value: dateRange,
                onChange: (event) => setDateRange(event.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" }),
                  /* @__PURE__ */ jsx("option", { value: "7d", children: "Ultimos 7 dias" }),
                  /* @__PURE__ */ jsx("option", { value: "30d", children: "Ultimos 30 dias" }),
                  /* @__PURE__ */ jsx("option", { value: "90d", children: "Ultimos 90 dias" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-subtle", children: "Ordenacao" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                className: "h-9 rounded-full border border-border bg-surface px-3 text-xs text-text shadow-soft focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200",
                value: sortOrder,
                onChange: (event) => setSortOrder(event.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "recent", children: "Mais recentes" }),
                  /* @__PURE__ */ jsx("option", { value: "oldest", children: "Mais antigos" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "ml-auto text-xs text-text-muted hover:text-text",
              onClick: resetFilters,
              children: "Limpar filtros"
            }
          )
        ] }),
        activeTab === "Tudo" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/90 shadow-soft", children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(CardTitle, { children: "Dossie Juridico" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: "Resumo gerado e pontos relevantes." })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 pt-4 text-sm text-text", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [
                    /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-[#D36D8C]" }),
                    "Resumo gerado por IA"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-text", children: highlights[0]?.content })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-soft", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [
                    /* @__PURE__ */ jsx(KeyRound, { className: "h-4 w-4 text-[#6BB9A8]" }),
                    "Pontos relevantes"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-text", children: highlights[1]?.content })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  className: "w-full justify-center gap-2 rounded-full border-border bg-white text-text hover:bg-surface-2",
                  onClick: handleScrollToTimeline,
                  children: [
                    "Ver linha do tempo completa",
                    /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { ref: timelineRef, children: /* @__PURE__ */ jsx(Timeline, { events: timelineEvents, onAddEvent: openModal }) })
        ] }),
        activeTab === "Tarefas" && /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { children: "Tarefas do caso" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: "Atividades vinculadas a este dossie." })
            ] }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: `/app/tarefas?casoId=${caso.id}`,
                className: "inline-flex h-9 items-center justify-center rounded-full border border-border bg-white px-4 text-xs font-semibold text-text shadow-soft hover:bg-surface-2",
                children: "Abrir tarefas"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-3 text-sm text-text-muted", children: caseTasks.length ? caseTasks.map((task) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-2xl border border-border bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)]",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 text-xs text-text-subtle", children: [
                  /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-text-muted", children: task.status.replace("_", " ") }),
                  task.dueDate && /* @__PURE__ */ jsxs("span", { children: [
                    "Vence em ",
                    formatDate(task.dueDate)
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-semibold text-text", children: normalizeChecklistTitle(task.title) }),
                task.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-text-subtle", children: task.description })
              ]
            },
            task.id
          )) : /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: "Nenhuma tarefa vinculada a este caso." }) })
        ] }),
        activeTab !== "Tudo" && activeTab !== "Tarefas" && /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex-row items-center justify-between space-y-0", children: [
            /* @__PURE__ */ jsx(CardTitle, { children: activeTab }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: openModal, children: "Adicionar evento" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-3 text-sm text-text-muted", children: filteredEvents.length ? filteredEvents.map((event) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-2xl border border-border bg-white p-3 shadow-[0_8px_20px_rgba(18,38,63,0.06)]",
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-text", children: event.title }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: event.description }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-[11px] text-text-subtle", children: formatDateTime(event.date) })
              ]
            },
            event.id
          )) : /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white p-4 text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: "Sem eventos para esta categoria." }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(Card, { className: "border-border bg-white/85", children: /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: caso.cliente.split(" ").map((part) => part[0]).slice(0, 2).join("") }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-text", children: caso.cliente }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: lead?.email ?? "cliente@email.com" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white px-3 py-2 text-xs text-text shadow-[0_8px_20px_rgba(18,38,63,0.06)]", children: lead?.phone ?? "(11) 99999-0000" })
        ] }) }),
        /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Tarefas" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "h-9 rounded-full px-3",
                onClick: openChecklistDrawerForCreate,
                children: "Adicionar tarefa"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm text-text-muted", children: [
            checklistItems.length === 0 && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white px-3 py-3 text-xs text-text-subtle shadow-soft", children: "Nenhuma tarefa cadastrada para este caso." }),
            checklistItems.map((item) => /* @__PURE__ */ jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: () => openChecklistDrawer(item.task),
                onKeyDown: (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openChecklistDrawer(item.task);
                  }
                },
                className: "flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)] transition hover:bg-surface-2",
                children: [
                  /* @__PURE__ */ jsx("span", { children: item.label }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: "text-[11px] font-semibold text-text-subtle hover:text-text",
                        onClick: (event) => {
                          event.stopPropagation();
                          openChecklistDrawer(item.task);
                        },
                        children: "Editar"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        className: "text-[11px] font-semibold text-text-subtle hover:text-danger",
                        onClick: (event) => {
                          event.stopPropagation();
                          handleDeleteChecklist(item.id);
                        },
                        children: "Excluir"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase",
                          item.status === "ok" ? "border-[#CFEBD8] bg-[#E8F7EE] text-[#167A3D]" : "border-[#F1D28A] bg-[#FFF1CC] text-[#8A5A00]"
                        ),
                        children: item.status === "ok" ? "ok" : "pendente"
                      }
                    )
                  ] })
                ]
              },
              item.id
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Notas do caso" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "text-xs text-text-subtle hover:text-text",
                  onClick: handleScrollToTimeline,
                  children: "Ver linha do tempo"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  className: "h-9 rounded-full px-3",
                  onClick: openModal,
                  children: "Adicionar nota"
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-2 text-sm text-text-muted", children: recentNotas.length ? recentNotas.map((nota) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-text", children: nota.title }),
                nota.description && /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-text-subtle", children: nota.description }),
                /* @__PURE__ */ jsx("div", { className: "mt-2 text-[11px] text-text-subtle", children: formatDateTime(nota.date) })
              ]
            },
            nota.id
          )) : /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-white px-3 py-3 text-xs text-text-subtle shadow-soft", children: "Nenhuma nota registrada para este caso." }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border-border bg-white/85", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Documentos recentes" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm text-text-muted", children: [
            caseDocs.slice(0, 3).map((doc) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "rounded-2xl border border-border bg-white px-3 py-2 shadow-[0_8px_20px_rgba(18,38,63,0.06)]",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-text", children: doc.title }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-text-subtle", children: doc.status })
                ]
              },
              doc.id
            )),
            /* @__PURE__ */ jsx(Link, { to: "/app/documentos", className: "text-xs text-primary hover:underline", children: "Ver documentos" })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      Modal,
      {
        open: modalOpen,
        onClose: closeModal,
        title: "Adicionar evento",
        description: "Registre um novo evento juridico.",
        footer: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: closeModal, disabled: eventSaving, children: "Cancelar" }),
          /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: handleSaveEvent, disabled: eventSaving, children: eventSaving ? "Salvando..." : "Salvar evento" })
        ] }),
        children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          eventError && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger", children: eventError }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Titulo" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Descreva o evento",
                value: eventForm.title,
                onChange: (event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Categoria" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                className: "h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text",
                value: eventForm.category,
                onChange: (event) => setEventForm((prev) => ({
                  ...prev,
                  category: event.target.value
                })),
                children: eventCategoryOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Descricao" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text",
                placeholder: "Detalhes do evento",
                value: eventForm.description,
                onChange: (event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))
              }
            )
          ] })
        ] })
      }
    ),
    taskDrawerOpen && createPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 bg-[rgba(17,24,39,0.35)]",
            style: { backdropFilter: "blur(6px)" },
            onClick: closeTaskDrawer
          }
        ),
        /* @__PURE__ */ jsxs("aside", { className: "absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col rounded-l-2xl border-l border-border bg-white shadow-[0_18px_50px_rgba(18,38,63,0.18)]", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "relative overflow-hidden border-b border-border px-6 py-6",
              style: {
                backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.96) 70%, rgba(215,236,255,0.3) 100%), url(${heroLight})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right top",
                backgroundSize: "320px"
              },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.32em] text-text-subtle", children: "Tarefa" }),
                  /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl text-text", children: taskDrawerMode === "create" ? "Nova tarefa" : taskDrawerForm.title || "Tarefa" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-text-muted", children: "Tarefa do caso" }),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase",
                          taskStatusPill(taskDrawerForm.status)
                        ),
                        children: taskDrawerForm.status.replace("_", " ")
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase",
                          taskPriorityPill(taskDrawerForm.priority)
                        ),
                        children: taskDrawerForm.priority
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "text-sm text-text-subtle hover:text-text",
                    onClick: closeTaskDrawer,
                    "aria-label": "Fechar",
                    children: "Fechar"
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm text-text-muted", children: [
            taskDrawerError && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger", children: taskDrawerError }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Titulo" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "Descreva a tarefa",
                  value: taskDrawerForm.title,
                  onChange: (event) => setTaskDrawerForm((prev) => ({ ...prev, title: event.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Status" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text",
                    value: taskDrawerForm.status,
                    onChange: (event) => setTaskDrawerForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    })),
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "pendente", children: "Pendente" }),
                      /* @__PURE__ */ jsx("option", { value: "em_progresso", children: "Em progresso" }),
                      /* @__PURE__ */ jsx("option", { value: "concluida", children: "Concluida" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Prioridade" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "h-10 w-full rounded-2xl border border-border bg-white px-3 text-sm text-text",
                    value: taskDrawerForm.priority,
                    onChange: (event) => setTaskDrawerForm((prev) => ({
                      ...prev,
                      priority: event.target.value
                    })),
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "baixa", children: "Baixa" }),
                      /* @__PURE__ */ jsx("option", { value: "normal", children: "Normal" }),
                      /* @__PURE__ */ jsx("option", { value: "alta", children: "Alta" })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Prazo" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "date",
                  value: taskDrawerForm.dueDate,
                  onChange: (event) => setTaskDrawerForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs uppercase tracking-wide text-text-subtle", children: "Descricao" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  className: "min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text",
                  placeholder: "Detalhes da tarefa",
                  value: taskDrawerForm.description,
                  onChange: (event) => setTaskDrawerForm((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-white px-4 py-3 text-xs text-text-subtle shadow-soft", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.2em] text-text-subtle", children: "Vinculo" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-text", children: [
                "Caso: ",
                caso.title,
                " - ",
                caso.cliente
              ] }),
              taskDrawerTask ? /* @__PURE__ */ jsxs("p", { className: "mt-1 text-[11px] text-text-subtle", children: [
                "Criada em ",
                formatDateTime(taskDrawerTask.createdAt)
              ] }) : /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-text-subtle", children: "O item sera criado para este caso." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-border bg-white/95 px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: closeTaskDrawer, disabled: taskDrawerSaving, children: "Cancelar" }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "primary",
                onClick: handleSaveTaskDrawer,
                disabled: taskDrawerSaving,
                children: taskDrawerSaving ? "Salvando..." : "Salvar tarefa"
              }
            )
          ] }) })
        ] })
      ] }),
      document.body
    )
  ] }) });
};
export {
  CasoPage
};
