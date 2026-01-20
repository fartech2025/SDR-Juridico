import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { organizationsService } from "@/services/organizationsService";
import { supabase } from "@/lib/supabaseClient";
import { FartechGuard } from "@/components/guards";
function OrganizationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    cnpj: "",
    email: "",
    responsavel_email: "",
    admin_email: "",
    admin_name: "",
    plan: "trial",
    max_users: 5,
    max_storage_gb: 10,
    max_cases: null,
    primary_color: "var(--brand-primary-dark)",
    secondary_color: null,
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_postal_code: ""
  });
  useEffect(() => {
    if (isEditMode && id) {
      loadOrganization(id);
    }
  }, [id, isEditMode]);
  const loadOrganization = async (orgId) => {
    try {
      setLoading(true);
      const org = await organizationsService.getById(orgId);
      if (org) {
        setFormData({
          name: org.name,
          slug: org.slug,
          cnpj: org.cnpj || "",
          email: org.email,
          phone: org.phone || "",
          responsavel_email: org.settings && org.settings.responsavel_email || "",
          admin_email: org.settings && org.settings.admin_email || "",
          admin_name: org.settings && org.settings.admin_name || "",
          plan: org.plan,
          max_users: org.max_users,
          max_storage_gb: org.max_storage_gb,
          max_cases: org.max_cases,
          primary_color: org.primary_color,
          secondary_color: org.secondary_color,
          address: org.address || void 0,
          address_street: org.address?.street || "",
          address_number: org.address?.number || "",
          address_complement: org.address?.complement || "",
          address_neighborhood: org.address?.neighborhood || "",
          address_city: org.address?.city || "",
          address_state: org.address?.state || "",
          address_postal_code: org.address?.zip_code || ""
        });
      }
    } catch (err) {
      setError("Erro ao carregar organiza\xE7\xE3o");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handlePlanChange = (plan) => {
    const limits = {
      trial: { max_users: 3, max_storage_gb: 5 },
      basic: { max_users: 5, max_storage_gb: 10 },
      professional: { max_users: 20, max_storage_gb: 50 },
      enterprise: { max_users: 100, max_storage_gb: 500 }
    };
    setFormData((prev) => ({
      ...prev,
      plan,
      ...limits[plan]
    }));
  };
  const planOptions = [
    { value: "trial", label: "Trial" },
    { value: "basic", label: "Basico" },
    { value: "professional", label: "Professional" },
    { value: "enterprise", label: "Enterprise" }
  ];
  const generateSlug = (name) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };
  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditMode ? prev.slug : generateSlug(name)
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEditMode && id) {
        await organizationsService.update(id, formData);
        navigate("/admin/organizations", { state: { refresh: true } });
        return;
      }
      const created = await organizationsService.create(formData);
      if (formData.admin_email) {
        const { data: sessionData } = await supabase.auth.getSession();
        let accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          accessToken = refreshed.session?.access_token;
        }
        if (!accessToken) {
          setError("Sess\xE3o expirada. Fa\xE7a login novamente para convidar o admin.");
          return;
        }
        const { error: inviteError } = await supabase.functions.invoke("invite-org-admin", {
          body: {
            orgId: created.id,
            adminEmail: formData.admin_email,
            adminName: formData.admin_name,
            responsavelEmail: formData.responsavel_email
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        if (inviteError) {
          setError(`Organiza\xE7\xE3o criada, mas falhou ao convidar o admin: ${inviteError.message}`);
          return;
        }
      }
      navigate("/admin/organizations", { state: { refresh: true } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar organiza\xE7\xE3o";
      setError(message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Carregando..." }) });
  }
  return /* @__PURE__ */ jsx(FartechGuard, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/admin/organizations"),
          className: "mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
          children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: isEditMode ? "Editar Organiza\xE7\xE3o" : "Nova Organiza\xE7\xE3o" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: isEditMode ? "Atualize as informa\xE7\xF5es da organiza\xE7\xE3o" : "Crie uma nova organiza\xE7\xE3o no sistema" })
      ] })
    ] }) }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      error && /* @__PURE__ */ jsx("div", { className: "mb-6 bg-red-50 border border-red-200 rounded-lg p-4", children: /* @__PURE__ */ jsx("p", { className: "text-red-800", children: error }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Informa\xE7\xF5es B\xE1sicas" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome da Organiza\xE7\xE3o *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    value: formData.name,
                    onChange: (e) => handleNameChange(e.target.value),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "Ex: Silva & Associados"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Slug (URL) *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    value: formData.slug,
                    onChange: (e) => setFormData((prev) => ({ ...prev, slug: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "silva-associados"
                  }
                ),
                /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-gray-500", children: [
                  "Usado na URL: ",
                  formData.slug || "slug",
                  ".fartech.com.br"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "CNPJ" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.cnpj,
                  onChange: (e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value })),
                  className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                  placeholder: "00.000.000/0000-00"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email do Respons\xE1vel" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    value: formData.responsavel_email,
                    onChange: (e) => setFormData((prev) => ({ ...prev, responsavel_email: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "responsavel@escritorio.com.br"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email do Admin da Organiza\xE7\xE3o" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    required: !isEditMode,
                    value: formData.admin_email,
                    onChange: (e) => setFormData((prev) => ({ ...prev, admin_email: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "admin@escritorio.com.br"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Esse admin receber\xE1 o email para cadastrar usu\xE1rios do escrit\xF3rio." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome do Admin (opcional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: formData.admin_name,
                  onChange: (e) => setFormData((prev) => ({ ...prev, admin_name: e.target.value })),
                  className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                  placeholder: "Nome completo"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Plano e Limites" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Plano *" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: planOptions.map((plan) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handlePlanChange(plan.value),
                  className: `p-4 border-2 rounded-lg text-left transition-all ${formData.plan === plan.value ? "border-emerald-600 bg-emerald-50" : "border-gray-300 hover:border-gray-400"}`,
                  children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 capitalize", children: plan.label })
                },
                plan.value
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "M\xE1ximo de Usu\xE1rios *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    required: true,
                    min: "1",
                    value: formData.max_users,
                    onChange: (e) => setFormData((prev) => ({ ...prev, max_users: parseInt(e.target.value) })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Armazenamento (GB) *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    required: true,
                    min: "1",
                    value: formData.max_storage_gb,
                    onChange: (e) => setFormData((prev) => ({ ...prev, max_storage_gb: parseInt(e.target.value) })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "M\xE1ximo de Casos" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    value: formData.max_cases || "",
                    onChange: (e) => setFormData((prev) => ({ ...prev, max_cases: e.target.value ? parseInt(e.target.value) : null })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "Ilimitado"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Identidade Visual" }) }),
          /* @__PURE__ */ jsx("div", { className: "p-6 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Cor Prim\xE1ria *" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "color",
                    value: formData.primary_color,
                    onChange: (e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value })),
                    className: "w-20 h-10 rounded cursor-pointer"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.primary_color,
                    onChange: (e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value })),
                    className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Cor Secund\xE1ria" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "color",
                    value: formData.secondary_color || "var(--brand-primary)",
                    onChange: (e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value })),
                    className: "w-20 h-10 rounded cursor-pointer"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.secondary_color || "",
                    onChange: (e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value })),
                    className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand-primary",
                    placeholder: "var(--brand-primary)"
                  }
                )
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Endere\xE7o" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "md:col-span-3", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Logradouro" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_street,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_street: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "Rua, Avenida, etc."
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "N\xFAmero" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_number,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_number: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Complemento" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_complement,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_complement: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Bairro" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_neighborhood,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_neighborhood: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Cidade" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_city,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_city: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Estado" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_state,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_state: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    maxLength: 2,
                    placeholder: "SP"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "CEP" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: formData.address_postal_code,
                    onChange: (e) => setFormData((prev) => ({ ...prev, address_postal_code: e.target.value })),
                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500",
                    placeholder: "00000-000"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate("/admin/organizations"),
              className: "px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: saving,
              className: "inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              children: [
                /* @__PURE__ */ jsx(Save, { className: "w-4 h-4 mr-2" }),
                saving ? "Salvando..." : isEditMode ? "Atualizar" : "Criar Organiza\xE7\xE3o"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
export {
  OrganizationForm as default
};
