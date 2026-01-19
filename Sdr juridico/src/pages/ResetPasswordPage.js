import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/layouts/AuthLayout';
export const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = React.useState('idle');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const handleSubmit = (event) => {
        event.preventDefault();
        setStatus('loading');
        window.setTimeout(() => {
            if (!password.trim() || password !== confirmPassword) {
                setStatus('error');
                toast.error('As senhas nao conferem.');
                return;
            }
            setStatus('idle');
            toast.success('Senha atualizada com sucesso.');
            navigate('/login');
        }, 700);
    };
    return (_jsxs(AuthLayout, { title: "CRIAR NOVA SENHA", sideSubtitle: "", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-subtle text-brand-primary", children: _jsx(ShieldCheck, { className: "h-6 w-6" }) }) }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-(--auth-text)", children: "Criar nova senha" }), _jsx("p", { className: "mt-2 text-sm text-(--auth-text-muted)", children: "Informe sua nova senha para concluir a redefinicao." }), _jsxs("form", { className: "mt-6 space-y-4", onSubmit: handleSubmit, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)", children: "Nova senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" }), _jsx("input", { type: "password", placeholder: "********", value: password, onChange: (event) => setPassword(event.target.value), className: "h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]", style: { borderColor: 'var(--auth-input-border)' } })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)", children: "Confirmacao" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" }), _jsx("input", { type: "password", placeholder: "********", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), className: "h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]", style: { borderColor: 'var(--auth-input-border)' } })] })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-(--auth-text-muted)", children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-500" }), "Minimo de 8 caracteres"] }), status === 'error' && (_jsx("div", { className: "rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger", children: "Verifique as senhas e tente novamente." })), _jsx("button", { type: "submit", className: "h-12 w-full rounded-xl bg-(--auth-primary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95", disabled: status === 'loading', children: status === 'loading' ? 'Atualizando...' : 'Salvar senha' }), _jsx(Link, { to: "/login", className: "block text-center text-xs text-(--auth-text-muted) hover:underline", children: "Voltar ao login" })] })] }));
};
