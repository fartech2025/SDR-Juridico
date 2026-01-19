import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/utils/errors';
const mapNotaToTimeline = (row) => {
    const title = row.texto ? row.texto.split('\n')[0].trim() : '';
    return {
        id: row.id,
        caso_id: row.entidade_id,
        titulo: title || 'Nota',
        descricao: row.texto || null,
        categoria: 'juridico',
        canal: 'Sistema',
        autor: row.created_by || null,
        tags: row.tags || [],
        data_evento: row.created_at,
        created_at: row.created_at,
        org_id: row.org_id || null,
    };
};
export const notasService = {
    async getNotas() {
        try {
            const { data, error } = await supabase
                .from('notas')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapNotaToTimeline(row));
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar notas', 'database_error');
        }
    },
    async getNotasByEntidade(entidade, entidadeId) {
        try {
            if (entidade !== 'caso') {
                return [];
            }
            const { data, error } = await supabase
                .from('notas')
                .select('*')
                .eq('entidade', entidade)
                .eq('entidade_id', entidadeId)
                .order('created_at', { ascending: false });
            if (error)
                throw new AppError(error.message, 'database_error');
            return (data || []).map((row) => mapNotaToTimeline(row));
        }
        catch (error) {
            throw new AppError(error instanceof Error ? error.message : 'Erro ao buscar notas', 'database_error');
        }
    },
};
