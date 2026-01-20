import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageState } from '@/components/PageState';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/lib/supabaseClient';
const buildFormState = (profile, fallbackEmail) => ({
    nome_completo: (profile === null || profile === void 0 ? void 0 : profile.nome_completo) || '',
    email: (profile === null || profile === void 0 ? void 0 : profile.email) || fallbackEmail,
    telefone: (profile === null || profile === void 0 ? void 0 : profile.telefone) || '',
    cargo: (profile === null || profile === void 0 ? void 0 : profile.cargo) || '',
    departamento: (profile === null || profile === void 0 ? void 0 : profile.departamento) || '',
    foto_url: (profile === null || profile === void 0 ? void 0 : profile.foto_url) || '',
});
export const UserProfilePage = () => {
    const { user, profile, loading, error, displayName, roleLabel, initials } = useCurrentUser();
    const fallbackEmail = (user === null || user === void 0 ? void 0 : user.email) || '';
    const [form, setForm] = React.useState(() => buildFormState(profile, fallbackEmail));
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
        setForm((prev) => (Object.assign(Object.assign({}, prev), { [field]: value })));
        setDirty(true);
    };
    const handleSave = async (event) => {
        event.preventDefault();
        if (!user || !profile)
            return;
        setSaving(true);
        try {
            const email = (form.email || fallbackEmail).trim();
            const updates = {
                nome_completo: form.nome_completo.trim(),
                email,
                telefone: form.telefone.trim() || null,
                cargo: form.cargo.trim() || null,
                departamento: form.departamento.trim() || null,
                foto_url: form.foto_url.trim() || null,
            };
            const { error: updateError } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', profile.id);
            if (updateError) {
                throw updateError;
            }
            toast.success('Perfil atualizado.');
            setDirty(false);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.';
            toast.error(message);
        }
        finally {
            setSaving(false);
        }
    };
    const pageStatus = loading
        ? 'loading'
        : error
            ? 'error'
            : profile
                ? 'ready'
                : 'empty';
    const fotoUrl = form.foto_url.trim();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "rounded-3xl border border-border bg-gradient-to-br from-white via-white to-[#f3f6ff] p-6 shadow-soft", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-semibold text-primary", children: fotoUrl ? (_jsx("img", { src: fotoUrl, alt: displayName, className: "h-full w-full object-cover", loading: "lazy" })) : (_jsx("span", { children: initials })) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-text-subtle", children: "Perfil" }), _jsx("h1", { className: "text-2xl font-semibold text-text", children: displayName }), _jsx("p", { className: "text-sm text-text-muted", children: roleLabel })] })] }), _jsx("div", { className: "text-xs text-text-muted", children: fallbackEmail })] }) }), _jsx(PageState, { status: pageStatus, emptyTitle: "Perfil nao encontrado", emptyDescription: "Seu perfil ainda nao foi registrado.", errorDescription: (error === null || error === void 0 ? void 0 : error.message) || 'Nao foi possivel carregar o perfil.', children: _jsx(Card, { className: "border border-border bg-surface/90", children: _jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [_jsxs(CardHeader, { className: "space-y-2", children: [_jsx(CardTitle, { children: "Dados do usuario" }), _jsx(CardDescription, { children: "Atualize as informacoes principais do seu perfil." })] }), _jsxs(CardContent, { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Nome completo" }), _jsx(Input, { value: form.nome_completo, onChange: handleChange('nome_completo'), placeholder: "Seu nome completo" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Email" }), _jsx(Input, { value: form.email, readOnly: true, className: "bg-surface-2 text-text-subtle" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Telefone" }), _jsx(Input, { value: form.telefone, onChange: handleChange('telefone'), placeholder: "(00) 00000-0000" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Cargo" }), _jsx(Input, { value: form.cargo, onChange: handleChange('cargo'), placeholder: "Ex: Admin, Gestor" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Departamento" }), _jsx(Input, { value: form.departamento, onChange: handleChange('departamento'), placeholder: "Ex: Operacoes" })] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: "text-xs font-semibold text-text", children: "Foto (URL)" }), _jsx(Input, { value: form.foto_url, onChange: handleChange('foto_url'), placeholder: "https://..." })] })] }), _jsxs(CardFooter, { className: "justify-end", children: [_jsx(Button, { type: "button", variant: "ghost", onClick: updateFormFromProfile, disabled: !dirty || saving, children: "Cancelar" }), _jsx(Button, { type: "submit", variant: "primary", disabled: !dirty || saving, children: saving ? 'Salvando...' : 'Salvar' })] })] }) }) })] }));
};
