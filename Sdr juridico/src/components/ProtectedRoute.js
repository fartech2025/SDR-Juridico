import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
// ProtectedRoute desabilitado temporariamente até configurar Supabase
export function ProtectedRoute({ children }) {
    // Permitir acesso sem autenticação enquanto Supabase não está configurado
    return _jsx(_Fragment, { children: children });
}
