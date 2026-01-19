import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
const roleLabels = {
    fartech_admin: 'Admin',
    org_admin: 'Gestor',
    user: 'Usuario',
};
const resolveRoleFromPermissoes = (permissoes, memberRole) => {
    if (permissoes.includes('fartech_admin')) {
        return 'fartech_admin';
    }
    if (memberRole && ['admin', 'gestor', 'org_admin'].includes(memberRole)) {
        return 'org_admin';
    }
    if (permissoes.includes('gestor') || permissoes.includes('org_admin')) {
        return 'org_admin';
    }
    return 'user';
};
const deriveDisplayName = (profile, user) => {
    const metadataName = user?.user_metadata && typeof user.user_metadata === 'object'
        ? user.user_metadata.nome_completo ||
            user.user_metadata.nome
        : undefined;
    const fallbackEmail = user?.email ? user.email.split('@')[0] : null;
    return (profile?.nome_completo || metadataName || fallbackEmail || 'Usuario').trim();
};
const deriveInitials = (value) => {
    const parts = value.split(' ').filter(Boolean);
    if (parts.length === 0)
        return 'US';
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
export function useCurrentUser() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState('user');
    const [orgId, setOrgId] = useState(null);
    const [orgName, setOrgName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const missingTableRef = useRef(false);
    const isMissingUsuariosTable = (err) => {
        const message = err?.message || '';
        return (err?.code === '42P01' ||
            message.includes('schema cache') ||
            message.includes("Could not find the table 'public.usuarios'"));
    };
    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }
        if (!user) {
            setProfile(null);
            setRole('user');
            setOrgId(null);
            setOrgName(null);
            setError(null);
            setLoading(false);
            return;
        }
        let active = true;
        setLoading(true);
        setError(null);
        const load = async () => {
            if (missingTableRef.current) {
                setProfile(null);
                setRole('user');
                setOrgId(null);
                setOrgName(null);
                setLoading(false);
                return;
            }
            const { data, error: profileError } = await supabase
                .from('usuarios')
                .select('id, nome_completo, email, permissoes, created_at, updated_at')
                .eq('id', user.id)
                .single();
            if (!active)
                return;
            if (profileError) {
                if (isMissingUsuariosTable(profileError)) {
                    missingTableRef.current = true;
                }
                else {
                    const message = profileError?.message || 'Erro ao carregar dados do usuario';
                    setError(new Error(message));
                }
            }
            const nextProfile = data || null;
            setProfile(nextProfile);
            const permissoes = nextProfile?.permissoes || [];
            const { data: memberData } = await supabase
                .from('org_members')
                .select('org_id, role')
                .eq('user_id', user.id)
                .eq('ativo', true)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();
            const membershipRole = memberData?.role || null;
            setRole(resolveRoleFromPermissoes(permissoes, membershipRole));
            setOrgId(memberData?.org_id || null);
            if (memberData?.org_id) {
                const { data: orgData } = await supabase
                    .from('orgs')
                    .select('id, nome, name, slug')
                    .eq('id', memberData.org_id)
                    .maybeSingle();
                const resolvedOrgName = (orgData && (orgData.nome || orgData.name)) ||
                    orgData?.slug ||
                    null;
                setOrgName(resolvedOrgName);
            }
            else {
                setOrgName(null);
            }
            setLoading(false);
        };
        load().catch((err) => {
            if (!active)
                return;
            setError(err instanceof Error ? err : new Error('Erro ao carregar dados do usuario'));
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [authLoading, user?.id]);
    const displayName = useMemo(() => deriveDisplayName(profile, user), [profile, user]);
    const shortName = useMemo(() => displayName.split(' ').filter(Boolean)[0] || displayName, [displayName]);
    const initials = useMemo(() => deriveInitials(displayName), [displayName]);
    const roleLabel = roleLabels[role];
    return {
        loading,
        error,
        user,
        profile,
        orgId,
        orgName: orgName || 'SDR Juridico Online',
        role,
        roleLabel,
        displayName,
        shortName,
        initials,
    };
}
