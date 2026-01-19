import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
/**
 * Exemplos de Uso dos Componentes UI
 *
 * Este arquivo demonstra como usar os componentes do Design System
 * em páginas e formulários reais do projeto.
 */
import { useState } from 'react';
import { Search, Mail, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardBody, CardFooter, Input, Textarea, Select, Badge, Alert, Spinner, } from '@/components/ui';
// ===== EXEMPLO 1: Formulário de Contato =====
export function ExampleContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simular envio
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setShowSuccess(true);
    };
    return (_jsxs(Card, { className: "max-w-2xl mx-auto", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Entre em Contato" }) }), _jsxs(CardBody, { children: [showSuccess && (_jsx(Alert, { variant: "success", title: "Mensagem Enviada!", onClose: () => setShowSuccess(false), children: "Entraremos em contato em breve." })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Nome Completo", placeholder: "Digite seu nome...", required: true, error: errors.name }), _jsx(Input, { label: "Email", type: "email", placeholder: "seu@email.com", icon: _jsx(Mail, { className: "w-4 h-4" }), required: true, error: errors.email, helperText: "Usaremos para responder sua mensagem" }), _jsxs(Select, { label: "Assunto", required: true, children: [_jsx("option", { value: "", children: "Selecione um assunto..." }), _jsx("option", { value: "info", children: "Informa\u00E7\u00F5es" }), _jsx("option", { value: "support", children: "Suporte" }), _jsx("option", { value: "bug", children: "Reportar Bug" })] }), _jsx(Textarea, { label: "Mensagem", placeholder: "Digite sua mensagem...", rows: 5, required: true, error: errors.message })] })] }), _jsxs(CardFooter, { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "ghost", type: "button", children: "Cancelar" }), _jsx(Button, { variant: "primary", type: "submit", loading: isSubmitting, children: "Enviar Mensagem" })] })] }));
}
// ===== EXEMPLO 2: Lista de Processos =====
export function ExampleProcessList() {
    const processes = [
        { id: 1, number: '1234567-89.2024.8.26.0100', status: 'active', priority: 'high' },
        { id: 2, number: '9876543-21.2024.8.26.0100', status: 'pending', priority: 'medium' },
        { id: 3, number: '5555555-55.2024.8.26.0100', status: 'closed', priority: 'low' },
    ];
    const statusMap = {
        active: { label: 'Ativo', variant: 'success' },
        pending: { label: 'Pendente', variant: 'warning' },
        closed: { label: 'Encerrado', variant: 'neutral' },
    };
    const priorityMap = {
        high: { label: 'Alta', variant: 'danger' },
        medium: { label: 'Média', variant: 'warning' },
        low: { label: 'Baixa', variant: 'info' },
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold text-text", children: "Processos" }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Input, { placeholder: "Buscar processo...", icon: _jsx(Search, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "primary", icon: _jsx(Plus, { className: "w-4 h-4" }), children: "Novo Processo" })] })] }), _jsx("div", { className: "grid gap-4", children: processes.map(process => (_jsx(Card, { hover: true, children: _jsxs(CardBody, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-mono text-lg font-semibold text-text", children: process.number }), _jsx(Badge, { variant: statusMap[process.status].variant, children: statusMap[process.status].label }), _jsxs(Badge, { variant: priorityMap[process.priority].variant, children: ["Prioridade: ", priorityMap[process.priority].label] })] }), _jsx("p", { className: "text-sm text-text-muted", children: "\u00DAltima atualiza\u00E7\u00E3o: h\u00E1 2 horas" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Edit2, { className: "w-4 h-4" }), children: "Editar" }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Trash2, { className: "w-4 h-4" }), children: "Excluir" })] })] }) }, process.id))) })] }));
}
// ===== EXEMPLO 3: Estado de Loading =====
export function ExampleLoadingState() {
    return (_jsx(Card, { className: "max-w-md mx-auto", children: _jsxs(CardBody, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Spinner, { size: "lg", label: "Carregando processos..." }), _jsx(Alert, { variant: "info", className: "mt-6", children: "Buscando informa\u00E7\u00F5es do servidor..." })] }) }));
}
// ===== EXEMPLO 4: Dashboard com Cards Interativos =====
export function ExampleDashboard() {
    const stats = [
        { label: 'Processos Ativos', value: 24, variant: 'success' },
        { label: 'Pendentes', value: 8, variant: 'warning' },
        { label: 'Atrasados', value: 3, variant: 'danger' },
        { label: 'Finalizados', value: 156, variant: 'info' },
    ];
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map(stat => (_jsx(Card, { hover: true, interactive: true, children: _jsxs(CardBody, { className: "text-center py-6", children: [_jsx("div", { className: "text-4xl font-bold text-text mb-2", children: stat.value }), _jsx("div", { className: "text-sm text-text-muted mb-3", children: stat.label }), _jsx(Badge, { variant: stat.variant, children: "Ver detalhes" })] }) }, stat.label))) }));
}
// ===== EXEMPLO 5: Usando Design Tokens Diretamente =====
export function ExampleDirectTokens() {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "h-20 w-20 rounded-lg bg-brand-primary" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-brand-secondary" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-brand-accent" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "h-20 w-20 rounded-lg bg-success" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-warning" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-danger" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-info" })] }), _jsx(Card, { children: _jsxs(CardBody, { className: "space-y-3", children: [_jsx("div", { className: "p-4 rounded-lg bg-surface", children: "Surface (padr\u00E3o)" }), _jsx("div", { className: "p-4 rounded-lg bg-surface-2", children: "Surface 2" }), _jsx("div", { className: "p-4 rounded-lg bg-surface-alt", children: "Surface Alternativa" }), _jsx("div", { className: "p-4 rounded-lg bg-surface-raised", children: "Surface Elevada" })] }) }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "h-20 w-20 rounded-lg bg-surface shadow-xs" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-surface shadow-sm" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-surface shadow-md" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-surface shadow-lg" }), _jsx("div", { className: "h-20 w-20 rounded-lg bg-surface shadow-xl" })] })] }));
}
