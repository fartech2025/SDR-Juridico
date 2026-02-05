import { useCallback, useEffect, useState } from 'react'
import { documentosService } from '@/services/documentosService'
import type { DocumentoRow } from '@/lib/supabaseClient'
import type { Documento } from '@/types/domain'
import { mapDocumentoRowToDocumento } from '@/lib/mappers'

interface UseDocumentosState {
  documentos: Documento[]
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
      setState((prev) => ({
        ...prev,
        documentos: documentos.map(mapDocumentoRowToDocumento),
        loading: false,
      }))
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
      return mapDocumentoRowToDocumento(documento)
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
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos por status
   */
  const fetchByStatus = useCallback(async (status: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByStatus(status)
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
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
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
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
   * Busca documentos de um cliente
   */
  const fetchByCliente = useCallback(async (clienteId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByCliente(clienteId)
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos de um lead
   */
  const fetchByLead = useCallback(async (leadId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosByLead(leadId)
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Busca documentos arquivados
   */
  const fetchArquivados = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const documentos = await documentosService.getDocumentosArquivados()
      const mapped = documentos.map(mapDocumentoRowToDocumento)
      setState((prev) => ({ ...prev, documentos: mapped, loading: false }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err, loading: false }))
      throw err
    }
  }, [])

  /**
   * Cria um novo documento (com atualização otimista)
   */
  const createDocumento = useCallback(async (documento: Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const novoDocumento = await documentosService.createDocumento(documento)
      const mapped = mapDocumentoRowToDocumento(novoDocumento)
      setState((prev) => ({ ...prev, documentos: [mapped, ...prev.documentos] }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Atualiza um documento (com atualização otimista)
   */
  const updateDocumento = useCallback(
    async (id: string, updates: Partial<Omit<DocumentoRow, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const documentoAtualizado = await documentosService.updateDocumento(id, updates)
      const mapped = mapDocumentoRowToDocumento(documentoAtualizado)
      setState((prev) => ({
        ...prev,
        documentos: prev.documentos.map((d) => (d.id === id ? mapped : d)),
      }))
      return mapped
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
    },
    []
  )

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
   * Arquiva um documento (soft delete)
   */
  const arquivarDocumento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      await documentosService.arquivarDocumento(id)
      // Remove da lista de documentos ativos
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
   * Restaura um documento arquivado
   */
  const restaurarDocumento = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }))
      const documentoRestaurado = await documentosService.restaurarDocumento(id)
      const mapped = mapDocumentoRowToDocumento(documentoRestaurado)
      // Remove da lista de arquivados e recarrega
      setState((prev) => ({
        ...prev,
        documentos: prev.documentos.filter((d) => d.id !== id),
      }))
      return mapped
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
    return updateDocumento(id, { status: 'aprovado' })
  }, [updateDocumento])

  /**
   * Marca documento como rejeitado
   */
  const marcarRejeitado = useCallback(async (id: string) => {
    return updateDocumento(id, { status: 'rejeitado' })
  }, [updateDocumento])

  /**
   * Solicita documento novamente
   */
  const solicitarNovamente = useCallback(async (id: string) => {
    return updateDocumento(id, { status: 'solicitado' })
  }, [updateDocumento])

  /**
   * Marca documento como pendente
   */
  const marcarPendente = useCallback(async (id: string) => {
    return updateDocumento(id, { status: 'pendente' })
  }, [updateDocumento])

  /**
   * Marca documento como visualizado
   */
  const marcarVisualizado = useCallback(async (id: string) => {
    try {
      const documento = await documentosService.marcarVisualizado(id)
      setState((prev) => ({
        ...prev,
        documentos: prev.documentos.map((d) =>
          d.id === id ? mapDocumentoRowToDocumento(documento) : d
        ),
      }))
      return mapDocumentoRowToDocumento(documento)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

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
   * Abre documento para visualização
   */
  const abrirDocumento = useCallback(async (url: string): Promise<string> => {
    try {
      const signedUrl = await documentosService.obterUrlDocumento(url)
      return signedUrl
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao obter URL do documento')
      setState((prev) => ({ ...prev, error: err }))
      throw err
    }
  }, [])

  /**
   * Download do documento
   */
  const downloadDocumento = useCallback(async (url: string, nomeArquivo: string): Promise<void> => {
    try {
      await documentosService.downloadDocumento(url, nomeArquivo)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao fazer download')
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
    fetchByCliente,
    fetchByLead,
    fetchByStatus,
    fetchByTipo,
    fetchPendentes,
    fetchArquivados,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    arquivarDocumento,
    restaurarDocumento,
    marcarCompleto,
    marcarRejeitado,
    marcarPendente,
    marcarVisualizado,
    solicitarNovamente,
    fetchEstatisticas,
    abrirDocumento,
    downloadDocumento,
  }
}
