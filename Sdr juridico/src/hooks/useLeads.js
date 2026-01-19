/**
 * Hook para gerenciar leads com Supabase
 */
import { useState, useCallback, useEffect } from 'react';
import { leadsService } from '@/services/leadsService';
import { mapLeadRowToLead } from '@/lib/mappers';
export function useLeads() {
    const [state, setState] = useState({
        leads: [],
        loading: false,
        error: null,
    });
    // Buscar todos os leads
    const fetchLeads = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const leads = await leadsService.getLeads();
            setState((prev) => ({
                ...prev,
                leads: leads.map(mapLeadRowToLead),
                loading: false,
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
        }
    }, []);
    // Buscar leads por status
    const fetchByStatus = useCallback(async (status) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const leads = await leadsService.getLeadsByStatus(status);
            setState((prev) => ({
                ...prev,
                leads: leads.map(mapLeadRowToLead),
                loading: false,
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
        }
    }, []);
    // Buscar leads quentes
    const fetchHotLeads = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const leads = await leadsService.getHotLeads();
            setState((prev) => ({
                ...prev,
                leads: leads.map(mapLeadRowToLead),
                loading: false,
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
        }
    }, []);
    // Criar novo lead
    const createLead = useCallback(async (lead) => {
        try {
            const newLead = await leadsService.createLead(lead);
            setState((prev) => ({
                ...prev,
                leads: [mapLeadRowToLead(newLead), ...prev.leads],
            }));
            return mapLeadRowToLead(newLead);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    // Atualizar lead
    const updateLead = useCallback(async (id, updates) => {
        try {
            const updated = await leadsService.updateLead(id, updates);
            setState((prev) => ({
                ...prev,
                leads: prev.leads.map((lead) => lead.id === id ? mapLeadRowToLead(updated) : lead),
            }));
            return mapLeadRowToLead(updated);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    // Deletar lead
    const deleteLead = useCallback(async (id) => {
        try {
            await leadsService.deleteLead(id);
            setState((prev) => ({
                ...prev,
                leads: prev.leads.filter((lead) => lead.id !== id),
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    const assignLeadAdvogado = useCallback(async (id, advogadoId, advogadoNome) => {
        try {
            const updated = await leadsService.assignLeadAdvogado(id, advogadoId, advogadoNome);
            setState((prev) => ({
                ...prev,
                leads: prev.leads.map((lead) => lead.id === id ? mapLeadRowToLead(updated) : lead),
            }));
            return mapLeadRowToLead(updated);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    // Carregar leads ao montar
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);
    return {
        ...state,
        fetchLeads,
        fetchByStatus,
        fetchHotLeads,
        createLead,
        updateLead,
        deleteLead,
        assignLeadAdvogado,
    };
}
