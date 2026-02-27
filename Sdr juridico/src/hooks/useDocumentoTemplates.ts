import { useState, useCallback } from 'react'
import { documentoTemplateService } from '@/services/documentoTemplateService'
import type {
  DocumentoTemplate,
  DocumentoTemplateCreateInput,
  DocumentoTemplateUpdateInput,
  OrgBranding,
} from '@/types/documentoTemplate'

export function useDocumentoTemplates() {
  const [templates, setTemplates] = useState<DocumentoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await documentoTemplateService.listTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar templates'))
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (input: DocumentoTemplateCreateInput): Promise<DocumentoTemplate> => {
    const created = await documentoTemplateService.createTemplate(input)
    setTemplates((prev) => [created, ...prev])
    return created
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: DocumentoTemplateUpdateInput): Promise<DocumentoTemplate> => {
    const updated = await documentoTemplateService.updateTemplate(id, updates)
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    await documentoTemplateService.deleteTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const downloadPdf = useCallback(
    async (template: DocumentoTemplate, values: Record<string, string>, branding: OrgBranding) => {
      await documentoTemplateService.downloadPdf(template, values, branding)
    },
    [],
  )

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    downloadPdf,
  }
}
