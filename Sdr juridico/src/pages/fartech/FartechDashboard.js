import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Briefcase,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search
} from "lucide-react";
import { useFartechAdmin } from "@/hooks/useFartechAdmin";
import { FartechGuard } from "@/components/guards";
function FartechDashboard() {
  const { getGlobalStats, getOrgsWithAlerts, allOrgs, loadOrgsWithStats, loading } = useFartechAdmin();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      await loadOrgsWithStats();
      const globalStats = await getGlobalStats();
      setStats(globalStats);
      const orgsWithAlerts = await getOrgsWithAlerts();
      setAlerts(orgsWithAlerts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };
  const filteredOrgs = allOrgs?.filter(
    (org) => org.name.toLowerCase().includes(searchTerm.toLowerCase()) || org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return /* @__PURE__ */ jsx(FartechGuard, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Fartech Dashboard" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Vis\xE3o geral de todas as organiza\xE7\xF5es" })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/admin/organizations/new",
          className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
            "Nova Organiza\xE7\xE3o"
          ]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      stats && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Organiza\xE7\xF5es",
            value: stats.organizations.total,
            subtitle: `${stats.organizations.active} ativas`,
            icon: Building2,
            color: "emerald"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Usu\xE1rios",
            value: stats.users,
            subtitle: "Total de usu\xE1rios",
            icon: Users,
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Clientes",
            value: stats.clients,
            subtitle: "Cadastrados",
            icon: Briefcase,
            color: "purple"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Casos",
            value: stats.cases,
            subtitle: "Em andamento",
            icon: TrendingUp,
            color: "orange"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Armazenamento",
            value: `${stats.storage_gb.toFixed(1)}GB`,
            subtitle: "Total usado",
            icon: HardDrive,
            color: "red"
          }
        )
      ] }),
      alerts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center mb-4", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600 mr-2" }),
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-yellow-900", children: [
            "Alertas de Limites (",
            alerts.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: alerts.slice(0, 5).map((org) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-white rounded-lg p-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900", children: org.name }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 space-y-1", children: org.alerts.map((alert, idx) => /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: alert }, idx)) })
          ] }),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: `/admin/organizations/${org.id}`,
              className: "text-sm text-emerald-600 hover:underline",
              children: "Ver detalhes"
            }
          )
        ] }, org.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-gray-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Organiza\xE7\xF5es" }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/admin/organizations",
                className: "text-sm text-emerald-600 hover:underline",
                children: "Ver todas"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Buscar organiza\xE7\xF5es...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Organiza\xE7\xE3o" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Plano" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Usu\xE1rios" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Criado em" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\xE7\xF5es" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: loading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500", children: "Carregando..." }) }) : filteredOrgs && filteredOrgs.length > 0 ? filteredOrgs.slice(0, 10).map((org) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3", children: /* @__PURE__ */ jsx(Building2, { className: "w-5 h-5 text-emerald-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900", children: org.name }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: org.slug })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize", children: org.plan }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx(StatusBadge, { status: org.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-gray-900", children: "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-gray-500", children: new Date(org.created_at).toLocaleDateString("pt-BR") }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsx(
              Link,
              {
                to: `/admin/organizations/${org.id}`,
                className: "text-emerald-600 hover:underline text-sm",
                children: "Ver detalhes"
              }
            ) })
          ] }, org.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500", children: "Nenhuma organiza\xE7\xE3o encontrada" }) }) })
        ] }) })
      ] })
    ] })
  ] }) });
}
function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`, children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6" }) }) }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 mb-1", children: value }),
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: subtitle })
  ] });
}
function StatusBadge({ status }) {
  const statusConfig = {
    active: { label: "Ativo", class: "bg-green-100 text-green-800" },
    suspended: { label: "Suspenso", class: "bg-yellow-100 text-yellow-800" },
    cancelled: { label: "Cancelado", class: "bg-red-100 text-red-800" },
    pending: { label: "Pendente", class: "bg-gray-100 text-gray-700" }
  };
  const config = statusConfig[status] || statusConfig.active;
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: config.label });
}
export {
  FartechDashboard as default
};
