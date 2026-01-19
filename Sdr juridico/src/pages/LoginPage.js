import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logoMark from '@/assets/logo-mark.svg';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { permissionsService } from '@/services/permissionsService';
import { usePermissions } from '@/hooks/usePermissions';
export const LoginPage = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const { refreshPermissions } = usePermissions();
    const [status, setStatus] = React.useState('idle');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('loading');
        if (!email.trim() || !password.trim()) {
            setStatus('error');
            toast.error('Credenciais obrigatorias.');
            return;
        }
        const { error } = await signIn(email.trim(), password.trim());
        if (error) {
            setStatus('error');
            toast.error('Falha no login: ' + (error.message || 'verifique seus dados'));
            return;
        }
        setStatus('idle');
        toast.success('Acesso liberado.');
        // Aguarda o auth state e o perfil estarem prontos antes de redirecionar
        const resolveUserProfile = async () => {
            let lastUser = null;
            for (let attempt = 0; attempt < 5; attempt += 1) {
                // pequeno delay para evitar race de auth/profile
                await new Promise((resolve) => setTimeout(resolve, 150));
                lastUser = await permissionsService.getCurrentUser();
                if (lastUser)
                    return lastUser;
            }
            return lastUser;
        };
        await refreshPermissions();
        const currentUser = await resolveUserProfile();
        // Log para debug (pode remover depois)
        console.log('[Login] User profile:', {
            email: currentUser?.email,
            role: currentUser?.role,
            is_fartech_admin: currentUser?.is_fartech_admin,
            org_id: currentUser?.org_id,
        });
        // Redirecionamento pós-login:
        // - APENAS is_fartech_admin === true: /admin/organizations
        // - Demais usuários: /app/dashboard (guards cuidam do restante)
        if (currentUser?.is_fartech_admin === true) {
            toast.info(`Bem-vindo, Admin Fartech!`);
            navigate('/admin/organizations', { replace: true });
        }
        else {
            toast.info(`Bem-vindo, ${currentUser?.name || currentUser?.email}!`);
            navigate('/app/dashboard', { replace: true });
        }
    };
    return (_jsxs(AuthLayout, { title: "ACESSO RESTRITO", sideTitle: "Acesso OAB", sideSubtitle: "Produtividade e intelig\u00EAncia jur\u00EDdica em um painel moderno", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: logoMark, alt: "Logo", className: "h-12 w-12 rounded-full bg-white p-2 shadow-md" }), _jsxs("div", { className: "space-y-0.5", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)", children: "SDR Jur\u00EDdico" }), _jsx("p", { className: "text-sm font-semibold text-(--auth-text)", children: "Unir para avan\u00E7ar" })] })] }), _jsx("h2", { className: "mt-6 text-3xl font-semibold text-(--auth-text)", children: "\u00C1rea administrativa com seguran\u00E7a OAB" }), _jsx("p", { className: "mt-2 text-sm text-(--auth-text-muted)", children: "Utilize seu e-mail corporativo para acessar o painel. Dados protegidos e verifica\u00E7\u00F5es autom\u00E1ticas de acesso." }), _jsxs("form", { className: "mt-8 space-y-5", onSubmit: handleSubmit, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)", children: "Email profissional" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" }), _jsx("input", { type: "email", placeholder: "seu.email@oab.org.br", value: email, onChange: (event) => setEmail(event.target.value), className: "h-12 w-full rounded-xl border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--brand-secondary) focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.18)]", style: { borderColor: 'var(--auth-input-border)' } })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-[0.22em] text-(--auth-text-muted)", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" }), _jsx("input", { type: "password", placeholder: "********", value: password, onChange: (event) => setPassword(event.target.value), className: "h-12 w-full rounded-xl border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--brand-primary-dark) focus:outline-none focus:ring-2 focus:ring-[rgba(5,150,105,0.16)]", style: { borderColor: 'var(--auth-input-border)' } })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-(--auth-text-muted)", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-border accent-(--brand-secondary)" }), "Manter conectado"] }), _jsx(Link, { to: "/forgot-password", className: "text-(--auth-text-muted) hover:text-(--auth-text) hover:underline", children: "Esqueci minha senha" })] }), status === 'error' && (_jsx("div", { className: "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600", children: "Verifique email e senha e tente novamente." })), _jsxs("button", { type: "submit", className: "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-(--brand-secondary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-[rgba(99,102,241,0.35)] transition duration-200 hover:brightness-105 disabled:opacity-60", disabled: status === 'loading', children: [_jsx("span", { className: "absolute inset-0 bg-gradient-to-r from-[rgba(99,102,241,0.35)] via-transparent to-[rgba(212,32,39,0.22)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" }), _jsx("span", { className: "relative", children: status === 'loading' ? 'Entrando...' : 'Entrar' }), _jsx(ArrowRight, { className: "relative h-4 w-4" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-(--auth-text-muted)", children: [_jsx(ShieldCheck, { className: "h-4 w-4 text-(--brand-primary)" }), "Autentica\u00E7\u00E3o segura com monitoramento de acesso"] })] }), _jsxs("div", { className: "mt-6 flex items-center justify-between text-xs text-(--auth-text-muted)", children: [_jsx("span", { children: "Ou entrar com" }), _jsxs("div", { className: "flex items-center gap-3 font-semibold text-(--auth-text)", children: [_jsx("span", { className: "rounded-full bg-white px-3 py-1 shadow-sm", children: "GovBR" }), _jsx("span", { className: "rounded-full bg-white px-3 py-1 shadow-sm", children: "OAuth" })] })] })] }));
};
