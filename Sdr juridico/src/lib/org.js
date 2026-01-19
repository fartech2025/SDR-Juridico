import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/utils/errors';
export async function getActiveOrgId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        return null;
    try {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('permissoes')
            .eq('id', user.id)
            .maybeSingle();
        const permissoes = usuario?.permissoes || [];
        if (permissoes.includes('fartech_admin')) {
            return null;
        }
    }
    catch {
        // Ignora falhas ao verificar permissoes; continua para tentar org_members.
    }
    const { data: member } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
    return member?.org_id || null;
}
export async function requireOrgId() {
    const orgId = await getActiveOrgId();
    if (!orgId) {
        throw new AppError('Organizacao nao encontrada para o usuario atual', 'auth_error');
    }
    return orgId;
}
