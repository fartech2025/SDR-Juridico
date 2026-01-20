import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Users,
  ShieldCheck,
  Briefcase,
  Database,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useFartechAdmin } from "@/hooks/useFartechAdmin";
import { FartechGuard } from "@/components/guards";
import { organizationsService } from "@/services/organizationsService";
function OrganizationsList() {
  const { allOrgs, loadOrgsWithStats, loading } = useFartechAdmin();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortField] = useState("created_at");
  const [sortOrder] = useState("desc");
  const [orgsWithStats, setOrgsWithStats] = useState([]);
  useEffect(() => {
    loadOrgsWithStats();
  }, [loadOrgsWithStats, location.state]);
  useEffect(() => {
    const loadStats = async () => {
      if (!allOrgs) return;
      try {
        const stats = await Promise.all(
          allOrgs.map(async (org) => {
            const orgStats = await organizationsService.getStats(org.id);
            const userCount = orgStats.total_users || 0;
            const caseCount = orgStats.total_cases || 0;
            const storageUsed = Math.round(orgStats.storage_used_percentage || 0);
            const adminCount = orgStats.admin_users || 0;
            return {
              ...org,
              userCount,
              adminCount,
              caseCount,
              storageUsed
            };
          })
        );
        setOrgsWithStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estat\xEDsticas das organiza\xE7\xF5es:", error);
        setOrgsWithStats(allOrgs);
      }
    };
    loadStats();
  }, [allOrgs]);
  const filteredOrgs = (orgsWithStats || []).filter((org) => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) || org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) || org.cnpj?.includes(searchTerm) || false;
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesPlan = planFilter === "all" || org.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "plan":
        comparison = a.plan.localeCompare(b.plan);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
  const totalUsers = filteredOrgs.reduce((sum, org) => sum + (org.userCount || 0), 0);
  const totalOrgs = filteredOrgs.length;
  const activeOrgs = filteredOrgs.filter((org) => org.status === "active").length;
  const exportToCSV = () => {
    if (!filteredOrgs || filteredOrgs.length === 0) return;
    const csv = [
      ["Nome", "Slug", "CNPJ", "Plano", "Status", "Criado em"].join(","),
      ...filteredOrgs.map((org) => [
        org.name,
        org.slug,
        org.cnpj || "",
        org.plan,
        org.status,
        new Date(org.created_at).toLocaleDateString("pt-BR")
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organizacoes-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    a.click();
  };
  return /* @__PURE__ */ jsx(FartechGuard, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-12", style: { backgroundColor: "#f9fbfd", color: "#0f172a" }, children: [
    /* @__PURE__ */ jsx("div", { className: "border-b", style: { backgroundColor: "#ffffff", borderColor: "#e2e8f0" }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", style: { color: "#0f172a" }, children: "Gest\xE3o de Organiza\xE7\xF5es" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm", style: { color: "#475569" }, children: "Painel de controle Fartech - Vis\xE3o geral de todas as organiza\xE7\xF5es" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: exportToCSV,
              className: "inline-flex items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
                "Exportar"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/admin/organizations/new",
              className: "inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-strong",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                "Nova Organiza\xE7\xE3o"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 shadow-lg border border-slate-600/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-400 tracking-wider uppercase", children: "Total de Organiza\xE7\xF5es" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: totalOrgs })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-white/10 backdrop-blur-sm p-2.5", children: /* @__PURE__ */ jsx(Building2, { className: "h-7 w-7 text-slate-200" }) })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "relative mt-3 text-xs font-medium text-slate-300", children: [
            activeOrgs,
            " ativas"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 p-6 shadow-lg border border-emerald-700/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-emerald-300 tracking-wider uppercase", children: "Total de Usu\xE1rios" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: totalUsers })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-white/10 backdrop-blur-sm p-2.5", children: /* @__PURE__ */ jsx(Users, { className: "h-7 w-7 text-emerald-200" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "relative mt-3 text-xs font-medium text-emerald-200", children: "Across all orgs" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-blue-900 p-6 shadow-lg border border-indigo-700/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-indigo-300 tracking-wider uppercase", children: "Planos Enterprise" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: filteredOrgs.filter((o) => o.plan === "enterprise").length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-white/10 backdrop-blur-sm p-2.5", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-7 w-7 text-indigo-200" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "relative mt-3 text-xs font-medium text-indigo-200", children: "Premium clients" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-800 via-amber-900 to-orange-900 p-6 shadow-lg border border-amber-700/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-amber-300 tracking-wider uppercase", children: "Aten\xE7\xE3o Requerida" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold text-white", children: filteredOrgs.filter((o) => o.status === "suspended").length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-white/10 backdrop-blur-sm p-2.5", children: /* @__PURE__ */ jsx(AlertCircle, { className: "h-7 w-7 text-amber-200" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "relative mt-3 text-xs font-medium text-amber-200", children: "Orgs suspensas" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-3xl border p-6 shadow-soft", style: { backgroundColor: "#ffffff", borderColor: "#e2e8f0" }, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold", style: { color: "#0f172a" }, children: "Buscar" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-text-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Nome, slug ou CNPJ...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "h-12 w-full rounded-2xl border px-4 pl-11 text-sm placeholder:text-text-subtle focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15",
                style: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a" }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold text-text", children: "Status" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: statusFilter,
              onChange: (e) => setStatusFilter(e.target.value),
              className: "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" }),
                /* @__PURE__ */ jsx("option", { value: "active", children: "Ativo" }),
                /* @__PURE__ */ jsx("option", { value: "pending", children: "Pendente" }),
                /* @__PURE__ */ jsx("option", { value: "suspended", children: "Suspenso" }),
                /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Cancelado" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold text-text", children: "Plano" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: planFilter,
              onChange: (e) => setPlanFilter(e.target.value),
              className: "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" }),
                /* @__PURE__ */ jsx("option", { value: "trial", children: "Trial" }),
                /* @__PURE__ */ jsx("option", { value: "basic", children: "Basico" }),
                /* @__PURE__ */ jsx("option", { value: "professional", children: "Professional" }),
                /* @__PURE__ */ jsx("option", { value: "enterprise", children: "Enterprise" })
              ]
            }
          )
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12 text-text-muted", children: "Carregando organiza\xE7\xF5es..." }) : filteredOrgs.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: filteredOrgs.map((org) => /* @__PURE__ */ jsx(OrgCard, { org }, org.id)) }) : /* @__PURE__ */ jsx("div", { className: "rounded-3xl border border-border bg-surface p-12 text-center shadow-soft", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(Building2, { className: "mx-auto h-12 w-12 text-text-muted" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 text-sm font-semibold text-text", children: "Nenhuma organiza\xE7\xE3o encontrada" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-text-muted", children: searchTerm || statusFilter !== "all" || planFilter !== "all" ? "Tente ajustar os filtros de busca" : "Comece criando sua primeira organiza\xE7\xE3o" }),
        !searchTerm && statusFilter === "all" && planFilter === "all" && /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/admin/organizations/new",
            className: "inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-strong",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Nova Organiza\xE7\xE3o"
            ]
          }
        ) })
      ] }) })
    ] })
  ] }) });
}
function OrgCard({ org }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-surface shadow-soft transition-shadow hover:shadow-lg", children: [
    /* @__PURE__ */ jsx("div", { className: "border-b border-border/70 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "w-14 h-14 rounded-lg flex items-center justify-center",
            style: { backgroundColor: (org.primary_color || "var(--brand-primary)") + "20" },
            children: org.logo_url ? /* @__PURE__ */ jsx("img", { src: org.logo_url, alt: org.name, className: "w-12 h-12 rounded" }) : /* @__PURE__ */ jsx(Building2, { className: "w-7 h-7", style: { color: org.primary_color || "var(--brand-primary)" } })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-text", children: /* @__PURE__ */ jsx(
            Link,
            {
              to: `/admin/organizations/${org.id}/settings`,
              className: "transition-colors hover:text-brand-primary",
              children: org.name || "Sem nome"
            }
          ) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-text-muted", children: org.slug || "-" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-text-subtle", children: org.cnpj || "CNPJ n\xE3o cadastrado" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end space-y-2", children: [
        org.status && /* @__PURE__ */ jsx(StatusBadge, { status: org.status }),
        org.plan && /* @__PURE__ */ jsx(PlanBadge, { plan: org.plan })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary-subtle mx-auto", children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5 text-brand-primary" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-text", children: org.userCount || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Usu\xE1rios" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary-subtle", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-5 w-5 text-brand-secondary" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-text", children: org.adminCount || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Admins" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success-bg", children: /* @__PURE__ */ jsx(Briefcase, { className: "h-5 w-5 text-success" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-text", children: org.caseCount || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Casos" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning-bg", children: /* @__PURE__ */ jsx(Database, { className: "h-5 w-5 text-warning" }) }),
        /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-text", children: [
          org.storageUsed || 0,
          "%"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Storage" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-border/70 bg-surface-alt px-6 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-text-muted", children: [
        "Criado em ",
        new Date(org.created_at).toLocaleDateString("pt-BR")
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/admin/organizations/${org.id}`,
            className: "inline-flex items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text transition hover:bg-surface-alt",
            children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-1.5" }),
              "Ver Detalhes"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/admin/organizations/${org.id}/edit`,
            className: "inline-flex items-center rounded-xl bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-strong",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-1.5" }),
              "Editar"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function StatusBadge({ status }) {
  const statusConfig = {
    active: { label: "Ativo", class: "border-success-border bg-success-bg text-success" },
    suspended: { label: "Suspenso", class: "border-warning-border bg-warning-bg text-warning" },
    cancelled: { label: "Cancelado", class: "border-danger-border bg-danger-bg text-danger" },
    pending: { label: "Pendente", class: "border-border bg-surface-2 text-text-muted" }
  };
  const config = statusConfig[status] || statusConfig.pending;
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.class}`, children: config.label });
}
function PlanBadge({ plan }) {
  const planConfig = {
    trial: { label: "Trial", class: "border-border bg-surface-2 text-text-muted" },
    basic: { label: "B\xE1sico", class: "border-brand-primary-subtle bg-brand-primary-subtle text-brand-primary" },
    professional: { label: "Professional", class: "border-brand-secondary-subtle bg-brand-secondary-subtle text-brand-secondary" },
    enterprise: { label: "Enterprise", class: "border-info-border bg-info-bg text-info" }
  };
  const config = planConfig[plan] || planConfig.trial;
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.class}`, children: config.label });
}
export {
  OrganizationsList as default
};
