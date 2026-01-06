import { useCallback, useEffect, useState } from 'react'
import { documentosService } from '@/services/documentosService'
import type { Documentos } from '@/lib/supabaseClient'

interface UseDocumentosState {
  documentos: Documentos[]
  loading: boolean
  error: Error | null
}

interface Estatisticas {
  total: number
  pendentes: number
  completos: number
}

export function useDocumentos() {
  const [state, setState] = useState<UseDocumentosState>({
    documentos: [],
    loading: true,
    error: null,
  })

  /**
   * Busca todos os documentos
   */
  const fetchDocumentos = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentos()
      setState((prev) => ({ ...prev, documentos, loading: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
        loading: false,
      }))
    }
  }, [])

  /**
   * Busca um documento específico
   */
  const fetchDocumento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documento = await documentosService.getDocumento(id)
      return documento
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos de um caso
   */
  const fetchByCaso = useCallback(async (casoId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByCaso(casoId)
      setState((prev) => ({ ...prev, documentos, loading: false }))
      return documentos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos por status
   */
  const fetchByStatus = useCallback(async (status: 'pendente' | 'completo') => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByStatus(status)
      setState((prev) => ({ ...prev, documentos, loading: false }))
      return documentos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos por tipo
   */
  const fetchByTipo = useCallback(async (tipo: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByTipo(tipo)
      setState((prev) => ({ ...prev, documentos, loading: false }))
      return documentos
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos pendentes
   */
  const fetchPendentes = useCallback(async () => {
    return fetchByStatus('pendente')
  }, [fetchByStatus])

  /**
   * Cria um novo documento (com atualização otimista)
   */
  const createDocumento = useCallback(async (documento: Omit<Documentos, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoDocumento = await documentosService.createDocumento(documento)
      setState((prev) => ({ ...prev, documentos: [novoDocumento, ...prev.documentos] }))
      return novoDocumento
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um documento (com atualização otimista)
   */
  const updateDocumento = useCallback(async (id: string, updates: Partial<Omit<Documentos, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const documentoAtualizado = await documentosService.updateDocumento(id, updates)
      setState((prev) => ({
        ...prev,
        documentos: prev.documentos.map((d) => (d.id === id ? documentoAtualizado : d)),
      }))
      return documentoAtualizado
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Deleta um documento (com atualização otimista)
   */
  const deleteDocumento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await documentosService.deleteDocumento(id)
      setState((prev) => ({
        ...prev,
        documentos: prev.documentos.filter((d) => d.id !== id),
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Marca documento como completo
   */
  const marcarCompleto = useCallback(async (id: string) => {
    return updateDocumento(id, { status: 'completo' })
  }, [updateDocumento])

  /**
   * Marca documento como pendente
   */
  const marcarPendente = useCallback(async (id: string) => {
    return updateDocumento(id, { status: 'pendente' })
  }, [updateDocumento])

  /**
   * Busca estatísticas
   */
  const fetchEstatisticas = useCallback(async (): Promise<Estatisticas> => {
    try {
      return await documentosService.getEstatisticas()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Carrega documentos ao montar componente
   */
  useEffect(() => {
    fetchDocumentos()
  }, [fetchDocumentos])

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
    marcarPendente,
    fetchEstatisticas,
  }
}
