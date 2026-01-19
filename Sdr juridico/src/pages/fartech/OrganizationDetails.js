import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// OrganizationDetails - Detailed view of a single organization
// Date: 2026-01-13
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Users, Briefcase, HardDrive, TrendingUp, Calendar, MapPin, Building2, AlertCircle, CheckCircle, XCircle, Mail } from 'lucide-react';
import { organizationsService } from '@/services/organizationsService';
import { useFartechAdmin } from '@/hooks/useFartechAdmin';
import { FartechGuard } from '@/components/guards';
import { supabase } from '@/lib/supabaseClient';
export default function OrganizationDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { viewOrganization } = useFartechAdmin();
    const [loading, setLoading] = useState(true);
    const [organization, setOrganization] = useState(null);
    const [stats, setStats] = useState(null);
    const [usage, setUsage] = useState(null);
    const [error, setError] = useState(null);
    const [inviteStatus, setInviteStatus] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const settings = (organization?.settings || {});
    const trialEndsAt = settings.trial_ends_at;
    const enableApiAccess = Boolean(settings.enable_api_access);
    const enableWhiteLabel = Boolean(settings.enable_white_label);
    const enableCustomDomain = Boolean(settings.enable_custom_domain);
    const enableSso = Boolean(settings.enable_sso);
    const adminEmail = settings.admin_email;
    const adminName = settings.admin_name;
    const responsavelEmail = settings.responsavel_email;
    useEffect(() => {
        if (id) {
            loadOrganizationData(id);
        }
    }, [id]);
    const loadOrganizationData = async (orgId) => {
        try {
            setLoading(true);
            setError(null);
            const [org, orgStats, orgUsage] = await Promise.all([
                organizationsService.getById(orgId),
                organizationsService.getStats(orgId),
                organizationsService.getUsage(orgId),
            ]);
            if (!org) {
                setError('Organização não encontrada');
                return;
            }
            setOrganization(org);
            setStats(orgStats);
            setUsage(orgUsage);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
            setError(message);
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleViewAsOrg = async () => {
        if (id) {
            await viewOrganization(id);
            navigate('/app/dashboard');
        }
    };
    const handleResendInvite = async () => {
        if (!id)
            return;
        if (!adminEmail) {
            setInviteStatus({ type: 'error', message: 'Defina o e-mail do admin nas configurações da organização.' });
            return;
        }
        setInviteLoading(true);
        setInviteStatus(null);
        try {
            console.log('📧 Criando acesso para:', adminEmail);
            // Gerar senha temporária aleatória (forte)
            const tempPassword = `Temp${crypto.randomUUID().substring(0, 8)}!`;
            // Criar usuário com auto-confirmação (sem envio de email)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: adminEmail,
                password: tempPassword,
                options: {
                    data: {
                        nome_completo: adminName || adminEmail,
                        org_id: id,
                        role: 'org_admin',
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (signUpError) {
                // Se for erro de envio de email, ignorar e criar manualmente
                if (signUpError.message.includes('Error sending confirmation email') ||
                    signUpError.message.includes('sending confirmation')) {
                    console.log('⚠️ Email não configurado, criando usuário sem confirmação...');
                    // Mostrar mensagem de sucesso com instrução manual
                    setInviteStatus({
                        type: 'success',
                        message: `✅ Tentativa de criar acesso realizada!\n\nEmail: ${adminEmail}\nSenha: ${tempPassword}\n\n⚠️ IMPORTANTE:\n1. O Supabase não está configurado para enviar emails\n2. Configure o SMTP em: Settings → Auth → SMTP Settings\n3. Ou envie essas credenciais manualmente ao administrador`
                    });
                    return;
                }
                // Se usuário já existe, isso é ok - apenas informamos
                if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
                    console.log('⚠️ Usuário já existe, atualizando permissões...');
                    // Buscar ID do usuário existente pelo email em auth.users
                    const { data: authUser } = await supabase.auth.admin.getUserByEmail(adminEmail);
                    if (!authUser || !authUser.user) {
                        setInviteStatus({ type: 'error', message: 'Usuário não encontrado no sistema.' });
                        return;
                    }
                    const userId = authUser.user.id;
                    // Atualizar/criar na tabela usuarios
                    await supabase
                        .from('usuarios')
                        .upsert({
                        id: userId,
                        email: adminEmail,
                        nome_completo: adminName || adminEmail,
                        permissoes: ['org_admin'],
                    }, { onConflict: 'id' });
                    // Adicionar a org_members
                    await supabase
                        .from('org_members')
                        .upsert({
                        org_id: id,
                        user_id: userId,
                        role: 'admin',
                        ativo: true,
                    }, { onConflict: 'org_id,user_id' });
                    // Atualizar settings da organização
                    await supabase
                        .from('orgs')
                        .update({
                        settings: {
                            ...(organization?.settings || {}),
                            admin_email: adminEmail,
                            admin_name: adminName || adminEmail,
                            responsavel_email: responsavelEmail || null,
                            managed_by: userId,
                        },
                    })
                        .eq('id', id);
                    setInviteStatus({
                        type: 'success',
                        message: `Usuário já existe. Permissões atualizadas.\n\nEmail: ${adminEmail}\nInstrua o usuário a fazer login ou redefinir a senha.`
                    });
                    return;
                }
                console.error('❌ Erro ao criar usuário:', signUpError);
                setInviteStatus({ type: 'error', message: `Erro: ${signUpError.message}` });
                return;
            }
            const userId = signUpData.user?.id;
            if (!userId) {
                setInviteStatus({ type: 'error', message: 'Não foi possível criar o usuário.' });
                return;
            }
            console.log('✅ Usuário criado:', userId);
            // Adicionar à tabela usuarios
            await supabase
                .from('usuarios')
                .upsert({
                id: userId,
                email: adminEmail,
                nome_completo: adminName || adminEmail,
                permissoes: ['org_admin'],
            }, { onConflict: 'id' });
            // Adicionar à org_members
            await supabase
                .from('org_members')
                .upsert({
                org_id: id,
                user_id: userId,
                role: 'admin',
                ativo: true,
            }, { onConflict: 'org_id,user_id' });
            // Atualizar settings da organização
            await supabase
                .from('orgs')
                .update({
                settings: {
                    ...(organization?.settings || {}),
                    admin_email: adminEmail,
                    admin_name: adminName || adminEmail,
                    responsavel_email: responsavelEmail || null,
                    managed_by: userId,
                },
            })
                .eq('id', id);
            console.log('✅ Acesso criado com sucesso!');
            setInviteStatus({
                type: 'success',
                message: `✅ Acesso criado com sucesso!\n\nEmail: ${adminEmail}\nSenha temporária: ${tempPassword}\n\n⚠️ IMPORTANTE: Copie esta senha e envie ao administrador por canal seguro. Peça para alterar no primeiro acesso.`
            });
        }
        catch (err) {
            console.error('❌ Erro não capturado:', err);
            const message = err instanceof Error ? err.message : 'Erro ao criar acesso';
            setInviteStatus({ type: 'error', message });
        }
        finally {
            setInviteLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600 dark:text-gray-400", children: "Carregando..." }) }));
    }
    if (error || !organization) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: error || 'Organização não encontrada' }), _jsx("button", { onClick: () => navigate('/admin/organizations'), className: "mt-4 text-emerald-600 hover:underline", children: "Voltar para lista" })] }) }));
    }
    return (_jsx(FartechGuard, { children: _jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("div", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: () => navigate('/admin/organizations'), className: "mr-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 h-16 rounded-lg flex items-center justify-center mr-4", style: { backgroundColor: organization.primary_color + '20' }, children: organization.logo_url ? (_jsx("img", { src: organization.logo_url, alt: organization.name, className: "w-12 h-12 rounded" })) : (_jsx(Building2, { className: "w-8 h-8", style: { color: organization.primary_color } })) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: organization.name }), _jsxs("p", { className: "mt-1 text-sm text-gray-500 dark:text-gray-400", children: [organization.slug, " \u2022 ", _jsx(StatusBadge, { status: organization.status })] })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: handleViewAsOrg, className: "inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Visualizar como Org" }), _jsxs("button", { onClick: handleResendInvite, disabled: inviteLoading, className: "inline-flex items-center px-4 py-2 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), inviteLoading ? 'Enviando...' : 'Reenviar convite'] }), _jsxs(Link, { to: `/admin/organizations/${id}/edit`, className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors", children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Editar"] })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [inviteStatus && (_jsx("div", { className: `mb-6 rounded-lg border px-4 py-3 text-sm ${inviteStatus.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'}`, children: inviteStatus.message })), stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx(StatCard, { title: "Usu\u00E1rios", value: stats.total_users, icon: Users, color: "blue" }), _jsx(StatCard, { title: "Clientes", value: stats.total_clients, icon: Briefcase, color: "purple" }), _jsx(StatCard, { title: "Casos", value: stats.total_cases, icon: TrendingUp, color: "orange" }), _jsx(StatCard, { title: "Armazenamento", value: `${stats.storage_used_gb.toFixed(1)}GB`, icon: HardDrive, color: "red" })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [usage && (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Uso de Recursos" }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsx(UsageBar, { label: "Usu\u00E1rios", current: usage.users.current, limit: usage.users.limit, percentage: usage.users.percentage, unit: "usu\u00E1rios" }), _jsx(UsageBar, { label: "Armazenamento", current: usage.storage.current_gb, limit: usage.storage.limit_gb, percentage: usage.storage.percentage, unit: "GB" }), organization.max_cases && (_jsx(UsageBar, { label: "Casos", current: usage.cases.current, limit: usage.cases.limit ?? 0, percentage: usage.cases.percentage ?? 0, unit: "casos" }))] })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Detalhes do Plano" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Plano" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 dark:text-white capitalize", children: organization.plan })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Ciclo de Cobran\u00E7a" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 dark:text-white capitalize", children: organization.billing_cycle || 'monthly' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Limite de Usu\u00E1rios" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: organization.max_users })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Armazenamento" }), _jsxs("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [organization.max_storage_gb, "GB"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Limite de Casos" }), _jsx("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: organization.max_cases || 'Ilimitado' })] })] }) })] }), organization.address_street && (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsxs("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center", children: [_jsx(MapPin, { className: "w-5 h-5 mr-2" }), "Endere\u00E7o"] }) }), _jsxs("div", { className: "p-6", children: [_jsxs("p", { className: "text-gray-900 dark:text-white", children: [organization.address_street, ", ", organization.address_number, organization.address_complement && ` - ${organization.address_complement}`] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: organization.address_neighborhood }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [organization.address_city, " - ", organization.address_state] }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: ["CEP: ", organization.address_postal_code] })] })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Informa\u00E7\u00F5es" }) }), _jsxs("div", { className: "p-6 space-y-4", children: [organization.cnpj && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "CNPJ" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: organization.cnpj })] })), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Criado em" }), _jsxs("div", { className: "flex items-center text-gray-900 dark:text-white", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), new Date(organization.created_at).toLocaleDateString('pt-BR', {
                                                                            day: '2-digit',
                                                                            month: 'long',
                                                                            year: 'numeric'
                                                                        })] })] }), trialEndsAt && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Trial termina em" }), _jsxs("div", { className: "flex items-center text-gray-900 dark:text-white", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), new Date(trialEndsAt).toLocaleDateString('pt-BR')] })] }))] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Identidade Visual" }) }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: "Cor Prim\u00E1ria" }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 rounded border border-gray-300 dark:border-gray-600 mr-3", style: { backgroundColor: organization.primary_color } }), _jsx("span", { className: "text-gray-900 dark:text-white font-mono", children: organization.primary_color })] })] }), organization.secondary_color && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-2", children: "Cor Secund\u00E1ria" }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 rounded border border-gray-300 dark:border-gray-600 mr-3", style: { backgroundColor: organization.secondary_color } }), _jsx("span", { className: "text-gray-900 dark:text-white font-mono", children: organization.secondary_color })] })] })), organization.custom_domain && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Dom\u00EDnio Customizado" }), _jsx("p", { className: "text-gray-900 dark:text-white", children: organization.custom_domain })] }))] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Recursos Habilitados" }) }), _jsxs("div", { className: "p-6 space-y-3", children: [_jsx(FeatureItem, { enabled: enableApiAccess, label: "Acesso API" }), _jsx(FeatureItem, { enabled: enableWhiteLabel, label: "White Label" }), _jsx(FeatureItem, { enabled: enableCustomDomain, label: "Dom\u00EDnio Customizado" }), _jsx(FeatureItem, { enabled: enableSso, label: "SSO" })] })] })] })] })] })] }) }));
}
function StatusBadge({ status }) {
    const statusConfig = {
        active: { label: 'Ativo', class: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
        trial: { label: 'Trial', class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
        suspended: { label: 'Suspenso', class: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
        cancelled: { label: 'Cancelado', class: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`, children: config.label }));
}
function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`, children: _jsx(Icon, { className: "w-6 h-6" }) }) }), _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-1", children: value }), _jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: title })] }));
}
function UsageBar({ label, current, limit, percentage, unit }) {
    const getColor = () => {
        if (percentage >= 90)
            return 'bg-red-500';
        if (percentage >= 75)
            return 'bg-yellow-500';
        return 'bg-emerald-500';
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: label }), _jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: [current.toFixed(1), " / ", limit, " ", unit, " (", percentage.toFixed(0), "%)"] })] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5", children: _jsx("div", { className: `h-2.5 rounded-full transition-all ${getColor()}`, style: { width: `${Math.min(percentage, 100)}%` } }) })] }));
}
function FeatureItem({ enabled, label }) {
    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: label }), enabled ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" })) : (_jsx(XCircle, { className: "w-5 h-5 text-gray-400" }))] }));
}
