import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import logoMark from '@/assets/logo-mark.svg';
import { AuthLayout } from '@/layouts/AuthLayout';
export const ForgotPasswordPage = () => {
    const [status, setStatus] = React.useState('idle');
    const [email, setEmail] = React.useState('');
    const handleSubmit = (event) => {
        event.preventDefault();
        setStatus('loading');
        window.setTimeout(() => {
            if (!email.trim()) {
                setStatus('error');
                toast.error('Informe um email valido.');
                return;
            }
            setStatus('success');
            toast.success('Link de recuperacao enviado.');
        }, 700);
    };
    return (_jsxs(AuthLayout, { title: "RECUPERAR ACESSO", sideSubtitle: "", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("img", { src: logoMark, alt: "Logo", className: "h-10 w-10" }) }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-(--auth-text)", children: "Recuperar acesso" }), _jsx("p", { className: "mt-2 text-sm text-(--auth-text-muted)", children: "Informe seu email para receber o link de redefinicao." }), _jsxs("form", { className: "mt-6 space-y-4", onSubmit: handleSubmit, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase tracking-[0.2em] text-(--auth-text-muted)", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--auth-text-muted)" }), _jsx("input", { type: "email", placeholder: "email@seudominio.com", value: email, onChange: (event) => {
                                            setEmail(event.target.value);
                                            setStatus('idle');
                                        }, className: "h-12 w-full rounded-full border bg-(--auth-input-bg) pl-11 pr-4 text-sm text-(--auth-text) placeholder:text-(--auth-text-muted) focus:border-(--auth-primary) focus:outline-none focus:ring-2 focus:ring-[rgba(47,107,255,0.2)]", style: { borderColor: 'var(--auth-input-border)' } })] })] }), status === 'success' && (_jsxs("div", { className: "flex items-center gap-2 rounded-2xl border bg-white px-3 py-3 text-xs text-(--auth-text-muted) shadow-soft", style: { borderColor: 'var(--auth-border)' }, children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-500" }), "Link enviado. Verifique seu email."] })), status === 'error' && (_jsx("div", { className: "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600", children: "Email obrigatorio para enviar o link." })), _jsx("button", { type: "submit", className: "h-12 w-full rounded-xl bg-(--auth-primary) text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-soft transition hover:brightness-95", disabled: status === 'loading', children: status === 'loading' ? 'Enviando...' : 'Enviar link' }), _jsx(Link, { to: "/login", className: "block text-center text-xs text-(--auth-text-muted) hover:underline", children: "Voltar ao login" })] })] }));
};
