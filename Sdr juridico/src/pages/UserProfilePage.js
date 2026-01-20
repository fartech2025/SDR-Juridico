import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageState } from "@/components/PageState";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
const buildFormState = (profile, fallbackEmail) => ({
  nome_completo: profile?.nome_completo || "",
  email: profile?.email || fallbackEmail
});
const UserProfilePage = () => {
  const {
    user,
    profile,
    loading,
    error,
    displayName,
    roleLabel,
    initials
  } = useCurrentUser();
  const fallbackEmail = user?.email || "";
  const [form, setForm] = React.useState(
    () => buildFormState(profile, fallbackEmail)
  );
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const updateFormFromProfile = React.useCallback(() => {
    setForm(buildFormState(profile, fallbackEmail));
    setDirty(false);
  }, [profile, fallbackEmail]);
  React.useEffect(() => {
    updateFormFromProfile();
  }, [updateFormFromProfile]);
  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };
  const handleSave = async (event) => {
    event.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    try {
      const email = (form.email || fallbackEmail).trim();
      const updates = {
        nome_completo: form.nome_completo.trim(),
        email
      };
      const { error: updateError } = await supabase.from("usuarios").update(updates).eq("id", profile.id);
      if (updateError) {
        throw updateError;
      }
      toast.success("Perfil atualizado.");
      setDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel salvar o perfil.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  const pageStatus = loading ? "loading" : error ? "error" : profile ? "ready" : "empty";
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-3xl border border-border bg-gradient-to-br from-white via-white to-[#f3f6ff] p-6 shadow-soft" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-semibold text-primary" }, /* @__PURE__ */ React.createElement("span", null, initials)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs uppercase tracking-[0.3em] text-text-subtle" }, "Perfil"), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-semibold text-text" }, displayName), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-text-muted" }, roleLabel))), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-text-muted" }, fallbackEmail))), /* @__PURE__ */ React.createElement(
    PageState,
    {
      status: pageStatus,
      emptyTitle: "Perfil nao encontrado",
      emptyDescription: "Seu perfil ainda nao foi registrado.",
      errorDescription: error?.message || "Nao foi possivel carregar o perfil."
    },
    /* @__PURE__ */ React.createElement(Card, { className: "border border-border bg-surface/90" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave, className: "space-y-4" }, /* @__PURE__ */ React.createElement(CardHeader, { className: "space-y-2" }, /* @__PURE__ */ React.createElement(CardTitle, null, "Dados do usuario"), /* @__PURE__ */ React.createElement(CardDescription, null, "Atualize as informacoes principais do seu perfil.")), /* @__PURE__ */ React.createElement(CardContent, { className: "grid gap-4 md:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-text" }, "Nome completo"), /* @__PURE__ */ React.createElement(
      Input,
      {
        value: form.nome_completo,
        onChange: handleChange("nome_completo"),
        placeholder: "Seu nome completo"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-text" }, "Email"), /* @__PURE__ */ React.createElement(
      Input,
      {
        value: form.email,
        readOnly: true,
        className: "bg-surface-2 text-text-subtle"
      }
    ))), /* @__PURE__ */ React.createElement(CardFooter, { className: "justify-end" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        type: "button",
        variant: "ghost",
        onClick: updateFormFromProfile,
        disabled: !dirty || saving
      },
      "Cancelar"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        type: "submit",
        variant: "primary",
        disabled: !dirty || saving
      },
      saving ? "Salvando..." : "Salvar"
    ))))
  ));
};
export {
  UserProfilePage
};
