import { useCallback, useEffect, useState } from 'react';
import { documentosService } from '@/services/documentosService';
import { mapDocumentoRowToDocumento } from '@/lib/mappers';
export function useDocumentos() {
    const [state, setState] = useState({
        documentos: [],
        loading: true,
        error: null,
    });
    /**
     * Busca todos os documentos
     */
    const fetchDocumentos = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const documentos = await documentosService.getDocumentos();
            setState((prev) => ({
                ...prev,
                documentos: documentos.map(mapDocumentoRowToDocumento),
                loading: false,
            }));
        }
        catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Erro desconhecido'),
                loading: false,
            }));
        }
    }, []);
    /**
     * Busca um documento específico
     */
    const fetchDocumento = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const documento = await documentosService.getDocumento(id);
            return mapDocumentoRowToDocumento(documento);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca documentos de um caso
     */
    const fetchByCaso = useCallback(async (casoId) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const documentos = await documentosService.getDocumentosByCaso(casoId);
            const mapped = documentos.map(mapDocumentoRowToDocumento);
            setState((prev) => ({ ...prev, documentos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca documentos por status
     */
    const fetchByStatus = useCallback(async (status) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const documentos = await documentosService.getDocumentosByStatus(status);
            const mapped = documentos.map(mapDocumentoRowToDocumento);
            setState((prev) => ({ ...prev, documentos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca documentos por tipo
     */
    const fetchByTipo = useCallback(async (tipo) => {
        try {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            const documentos = await documentosService.getDocumentosByTipo(tipo);
            const mapped = documentos.map(mapDocumentoRowToDocumento);
            setState((prev) => ({ ...prev, documentos: mapped, loading: false }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err, loading: false }));
            throw err;
        }
    }, []);
    /**
     * Busca documentos pendentes
     */
    const fetchPendentes = useCallback(async () => {
        return fetchByStatus('pendente');
    }, [fetchByStatus]);
    /**
     * Cria um novo documento (com atualização otimista)
     */
    const createDocumento = useCallback(async (documento) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const novoDocumento = await documentosService.createDocumento(documento);
            const mapped = mapDocumentoRowToDocumento(novoDocumento);
            setState((prev) => ({ ...prev, documentos: [mapped, ...prev.documentos] }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Atualiza um documento (com atualização otimista)
     */
    const updateDocumento = useCallback(async (id, updates) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            const documentoAtualizado = await documentosService.updateDocumento(id, updates);
            const mapped = mapDocumentoRowToDocumento(documentoAtualizado);
            setState((prev) => ({
                ...prev,
                documentos: prev.documentos.map((d) => (d.id === id ? mapped : d)),
            }));
            return mapped;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Deleta um documento (com atualização otimista)
     */
    const deleteDocumento = useCallback(async (id) => {
        try {
            setState((prev) => ({ ...prev, error: null }));
            await documentosService.deleteDocumento(id);
            setState((prev) => ({
                ...prev,
                documentos: prev.documentos.filter((d) => d.id !== id),
            }));
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Marca documento como completo
     */
    const marcarCompleto = useCallback(async (id) => {
        return updateDocumento(id, { status: 'aprovado' });
    }, [updateDocumento]);
    /**
     * Marca documento como rejeitado
     */
    const marcarRejeitado = useCallback(async (id) => {
        return updateDocumento(id, { status: 'rejeitado' });
    }, [updateDocumento]);
    /**
     * Solicita documento novamente
     */
    const solicitarNovamente = useCallback(async (id) => {
        return updateDocumento(id, { status: 'solicitado' });
    }, [updateDocumento]);
    /**
     * Marca documento como pendente
     */
    const marcarPendente = useCallback(async (id) => {
        return updateDocumento(id, { status: 'pendente' });
    }, [updateDocumento]);
    /**
     * Busca estatísticas
     */
    const fetchEstatisticas = useCallback(async () => {
        try {
            return await documentosService.getEstatisticas();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Erro desconhecido');
            setState((prev) => ({ ...prev, error: err }));
            throw err;
        }
    }, []);
    /**
     * Carrega documentos ao montar componente
     */
    useEffect(() => {
        fetchDocumentos();
    }, [fetchDocumentos]);
    return {
        ...state,
        fetchDocumentos,
        fetchDocumento,
        fetchByCaso,
        fetchByStatus,
        fetchByTipo,
        fetchPendentes,
        createDocumento,
        updateDocumento,
        deleteDocumento,
        marcarCompleto,
        marcarRejeitado,
        marcarPendente,
        solicitarNovamente,
        fetchEstatisticas,
    };
}
