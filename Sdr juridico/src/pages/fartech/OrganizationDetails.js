import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Users,
  Briefcase,
  HardDrive,
  TrendingUp,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail
} from "lucide-react";
import { organizationsService } from "@/services/organizationsService";
import { useFartechAdmin } from "@/hooks/useFartechAdmin";
import { FartechGuard } from "@/components/guards";
import { supabase } from "@/lib/supabaseClient";
function OrganizationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { viewOrganization } = useFartechAdmin();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const [inviteStatus, setInviteStatus] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const settings = organization?.settings || {};
  const trialEndsAt = settings.trial_ends_at;
  const enableApiAccess = Boolean(settings.enable_api_access);
  const enableWhiteLabel = Boolean(settings.enable_white_label);
  const enableCustomDomain = Boolean(settings.enable_custom_domain);
  const enableSso = Boolean(settings.enable_sso);
  const adminEmail = settings.admin_email;
  const adminName = settings.admin_name;
  const responsavelEmail = settings.responsavel_email;
  useEffect(() => {
    if (id) {
      loadOrganizationData(id);
    }
  }, [id]);
  const loadOrganizationData = async (orgId) => {
    try {
      setLoading(true);
      setError(null);
      const [org, orgStats, orgUsage] = await Promise.all([
        organizationsService.getById(orgId),
        organizationsService.getStats(orgId),
        organizationsService.getUsage(orgId)
      ]);
      if (!org) {
        setError("Organiza\xE7\xE3o n\xE3o encontrada");
        return;
      }
      setOrganization(org);
      setStats(orgStats);
      setUsage(orgUsage);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleViewAsOrg = async () => {
    if (id) {
      await viewOrganization(id);
      navigate("/app/dashboard");
    }
  };
  const handleResendInvite = async () => {
    if (!id) return;
    if (!adminEmail) {
      setInviteStatus({ type: "error", message: "Defina o e-mail do admin nas configura\xE7\xF5es da organiza\xE7\xE3o." });
      return;
    }
    setInviteLoading(true);
    setInviteStatus(null);
    try {
      console.log("\u{1F4E7} Criando acesso para:", adminEmail);
      const tempPassword = `Temp${crypto.randomUUID().substring(0, 8)}!`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: tempPassword,
        options: {
          data: {
            nome_completo: adminName || adminEmail,
            org_id: id,
            role: "org_admin"
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (signUpError) {
        if (signUpError.message.includes("Error sending confirmation email") || signUpError.message.includes("sending confirmation")) {
          console.log("\u26A0\uFE0F Email n\xE3o configurado, criando usu\xE1rio sem confirma\xE7\xE3o...");
          setInviteStatus({
            type: "success",
            message: `\u2705 Tentativa de criar acesso realizada!

Email: ${adminEmail}
Senha: ${tempPassword}

\u26A0\uFE0F IMPORTANTE:
1. O Supabase n\xE3o est\xE1 configurado para enviar emails
2. Configure o SMTP em: Settings \u2192 Auth \u2192 SMTP Settings
3. Ou envie essas credenciais manualmente ao administrador`
          });
          return;
        }
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          console.log("\u26A0\uFE0F Usu\xE1rio j\xE1 existe, atualizando permiss\xF5es...");
          const { data: authUser } = await supabase.auth.admin.getUserByEmail(adminEmail);
          if (!authUser || !authUser.user) {
            setInviteStatus({ type: "error", message: "Usu\xE1rio n\xE3o encontrado no sistema." });
            return;
          }
          const userId2 = authUser.user.id;
          await supabase.from("usuarios").upsert({
            id: userId2,
            email: adminEmail,
            nome_completo: adminName || adminEmail,
            permissoes: ["org_admin"]
          }, { onConflict: "id" });
          await supabase.from("org_members").upsert({
            org_id: id,
            user_id: userId2,
            role: "admin",
            ativo: true
          }, { onConflict: "org_id,user_id" });
          await supabase.from("orgs").update({
            settings: {
              ...organization?.settings || {},
              admin_email: adminEmail,
              admin_name: adminName || adminEmail,
              responsavel_email: responsavelEmail || null,
              managed_by: userId2
            }
          }).eq("id", id);
          setInviteStatus({
            type: "success",
            message: `Usu\xE1rio j\xE1 existe. Permiss\xF5es atualizadas.

Email: ${adminEmail}
Instrua o usu\xE1rio a fazer login ou redefinir a senha.`
          });
          return;
        }
        console.error("\u274C Erro ao criar usu\xE1rio:", signUpError);
        setInviteStatus({ type: "error", message: `Erro: ${signUpError.message}` });
        return;
      }
      const userId = signUpData.user?.id;
      if (!userId) {
        setInviteStatus({ type: "error", message: "N\xE3o foi poss\xEDvel criar o usu\xE1rio." });
        return;
      }
      console.log("\u2705 Usu\xE1rio criado:", userId);
      await supabase.from("usuarios").upsert({
        id: userId,
        email: adminEmail,
        nome_completo: adminName || adminEmail,
        permissoes: ["org_admin"]
      }, { onConflict: "id" });
      await supabase.from("org_members").upsert({
        org_id: id,
        user_id: userId,
        role: "admin",
        ativo: true
      }, { onConflict: "org_id,user_id" });
      await supabase.from("orgs").update({
        settings: {
          ...organization?.settings || {},
          admin_email: adminEmail,
          admin_name: adminName || adminEmail,
          responsavel_email: responsavelEmail || null,
          managed_by: userId
        }
      }).eq("id", id);
      console.log("\u2705 Acesso criado com sucesso!");
      setInviteStatus({
        type: "success",
        message: `\u2705 Acesso criado com sucesso!

Email: ${adminEmail}
Senha tempor\xE1ria: ${tempPassword}

\u26A0\uFE0F IMPORTANTE: Copie esta senha e envie ao administrador por canal seguro. Pe\xE7a para alterar no primeiro acesso.`
      });
    } catch (err) {
      console.error("\u274C Erro n\xE3o capturado:", err);
      const message = err instanceof Error ? err.message : "Erro ao criar acesso";
      setInviteStatus({ type: "error", message });
    } finally {
      setInviteLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Carregando..." }) });
  }
  if (error || !organization) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: error || "Organiza\xE7\xE3o n\xE3o encontrada" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/admin/organizations"),
          className: "mt-4 text-emerald-600 hover:underline",
          children: "Voltar para lista"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsx(FartechGuard, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => navigate("/admin/organizations"),
            className: "mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-16 h-16 rounded-lg flex items-center justify-center mr-4",
              style: { backgroundColor: organization.primary_color + "20" },
              children: organization.logo_url ? /* @__PURE__ */ jsx("img", { src: organization.logo_url, alt: organization.name, className: "w-12 h-12 rounded" }) : /* @__PURE__ */ jsx(Building2, { className: "w-8 h-8", style: { color: organization.primary_color } })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: organization.name }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
              organization.slug,
              " \u2022 ",
              /* @__PURE__ */ jsx(StatusBadge, { status: organization.status })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleViewAsOrg,
            className: "inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
            children: "Visualizar como Org"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleResendInvite,
            disabled: inviteLoading,
            className: "inline-flex items-center px-4 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50:bg-emerald-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
            children: [
              /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 mr-2" }),
              inviteLoading ? "Enviando..." : "Reenviar convite"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/admin/organizations/${id}/edit`,
            className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4 mr-2" }),
              "Editar"
            ]
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      inviteStatus && /* @__PURE__ */ jsx(
        "div",
        {
          className: `mb-6 rounded-lg border px-4 py-3 text-sm ${inviteStatus.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`,
          children: inviteStatus.message
        }
      ),
      stats && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Usu\xE1rios",
            value: stats.total_users,
            icon: Users,
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Clientes",
            value: stats.total_clients,
            icon: Briefcase,
            color: "purple"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Casos",
            value: stats.total_cases,
            icon: TrendingUp,
            color: "orange"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Armazenamento",
            value: `${stats.storage_used_gb.toFixed(1)}GB`,
            icon: HardDrive,
            color: "red"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          usage && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Uso de Recursos" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
              /* @__PURE__ */ jsx(
                UsageBar,
                {
                  label: "Usu\xE1rios",
                  current: usage.users.current,
                  limit: usage.users.limit,
                  percentage: usage.users.percentage,
                  unit: "usu\xE1rios"
                }
              ),
              /* @__PURE__ */ jsx(
                UsageBar,
                {
                  label: "Armazenamento",
                  current: usage.storage.current_gb,
                  limit: usage.storage.limit_gb,
                  percentage: usage.storage.percentage,
                  unit: "GB"
                }
              ),
              organization.max_cases && /* @__PURE__ */ jsx(
                UsageBar,
                {
                  label: "Casos",
                  current: usage.cases.current,
                  limit: usage.cases.limit ?? 0,
                  percentage: usage.cases.percentage ?? 0,
                  unit: "casos"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Detalhes do Plano" }) }),
            /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Plano" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-gray-900 capitalize", children: organization.plan })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Ciclo de Cobran\xE7a" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-gray-900 capitalize", children: organization.billing_cycle || "monthly" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Limite de Usu\xE1rios" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-gray-900", children: organization.max_users })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Armazenamento" }),
                /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [
                  organization.max_storage_gb,
                  "GB"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Limite de Casos" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-gray-900", children: organization.max_cases || "Ilimitado" })
              ] })
            ] }) })
          ] }),
          organization.address_street && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 mr-2" }),
              "Endere\xE7o"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-gray-900", children: [
                organization.address_street,
                ", ",
                organization.address_number,
                organization.address_complement && ` - ${organization.address_complement}`
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: organization.address_neighborhood }),
              /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
                organization.address_city,
                " - ",
                organization.address_state
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
                "CEP: ",
                organization.address_postal_code
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Informa\xE7\xF5es" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
              organization.cnpj && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "CNPJ" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: organization.cnpj })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Criado em" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-900", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 mr-2" }),
                  new Date(organization.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })
                ] })
              ] }),
              trialEndsAt && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Trial termina em" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-900", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 mr-2" }),
                  new Date(trialEndsAt).toLocaleDateString("pt-BR")
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Identidade Visual" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Cor Prim\xE1ria" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-10 h-10 rounded border border-gray-300 mr-3",
                      style: { backgroundColor: organization.primary_color }
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-mono", children: organization.primary_color })
                ] })
              ] }),
              organization.secondary_color && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Cor Secund\xE1ria" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-10 h-10 rounded border border-gray-300 mr-3",
                      style: { backgroundColor: organization.secondary_color }
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-mono", children: organization.secondary_color })
                ] })
              ] }),
              organization.custom_domain && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Dom\xEDnio Customizado" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: organization.custom_domain })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Recursos Habilitados" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-3", children: [
              /* @__PURE__ */ jsx(
                FeatureItem,
                {
                  enabled: enableApiAccess,
                  label: "Acesso API"
                }
              ),
              /* @__PURE__ */ jsx(
                FeatureItem,
                {
                  enabled: enableWhiteLabel,
                  label: "White Label"
                }
              ),
              /* @__PURE__ */ jsx(
                FeatureItem,
                {
                  enabled: enableCustomDomain,
                  label: "Dom\xEDnio Customizado"
                }
              ),
              /* @__PURE__ */ jsx(
                FeatureItem,
                {
                  enabled: enableSso,
                  label: "SSO"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
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
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`, children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6" }) }) }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 mb-1", children: value }),
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: title })
  ] });
}
function UsageBar({ label, current, limit, percentage, unit }) {
  const getColor = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-emerald-500";
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
        current.toFixed(1),
        " / ",
        limit,
        " ",
        unit,
        " (",
        percentage.toFixed(0),
        "%)"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2.5", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: `h-2.5 rounded-full transition-all ${getColor()}`,
        style: { width: `${Math.min(percentage, 100)}%` }
      }
    ) })
  ] });
}
function FeatureItem({ enabled, label }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700", children: label }),
    enabled ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5 text-gray-400" })
  ] });
}
export {
  OrganizationDetails as default
};
