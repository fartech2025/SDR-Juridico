import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
export default function AuthCallback() {
    const navigate = useNavigate();
    useEffect(() => {
        // Capturar o hash da URL e processar o token
        const handleCallback = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                console.log('🔐 AuthCallback - Type:', type);
                console.log('🔐 AuthCallback - Has tokens:', !!accessToken, !!refreshToken);
                if (accessToken && refreshToken) {
                    // Definir a sessão com os tokens recebidos
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) {
                        console.error('❌ Erro ao definir sessão:', error);
                        navigate('/login?error=callback_failed');
                        return;
                    }
                    console.log('✅ Sessão definida com sucesso!', data.user?.email);
                    // Verificar se é confirmação de email ou signup
                    if (type === 'signup' || type === 'email_confirmation') {
                        // Redirecionar para página de definir senha
                        navigate('/reset-password');
                    }
                    else {
                        // Redirecionar para dashboard
                        navigate('/dashboard');
                    }
                }
                else {
                    console.warn('⚠️ Tokens não encontrados na URL');
                    navigate('/login?error=no_tokens');
                }
            }
            catch (err) {
                console.error('❌ Erro no callback:', err);
                navigate('/login?error=callback_exception');
            }
        };
        handleCallback();
    }, [navigate]);
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" }), _jsx("h2", { className: "text-xl font-semibold text-gray-800", children: "Processando..." }), _jsx("p", { className: "mt-2 text-gray-600", children: "Aguarde enquanto confirmamos seu acesso." })] }) }));
}
