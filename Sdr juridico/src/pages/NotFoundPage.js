import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export const NotFoundPage = () => {
    const navigate = useNavigate();
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center px-6 py-12", children: _jsxs(Card, { className: "w-full max-w-md text-center", children: [_jsxs(CardHeader, { className: "space-y-2", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-text-subtle", children: "404" }), _jsx(CardTitle, { children: "Pagina nao encontrada" })] }), _jsxs(CardContent, { className: "space-y-4 text-sm text-text-muted", children: [_jsx("p", { children: "Verifique a rota ou retorne para o dashboard." }), _jsx(Button, { variant: "primary", onClick: () => navigate('/app/dashboard'), children: "Ir para o app" })] })] }) }));
};
