import { useState, useCallback, useEffect } from 'react'
import { orgBrandingService } from '@/services/orgBrandingService'
import type { OrgBranding } from '@/types/documentoTemplate'
import { DEFAULT_BRANDING } from '@/types/documentoTemplate'

export function useOrgBranding() {
  const [branding, setBranding] = useState<OrgBranding>(DEFAULT_BRANDING)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<Error | null>(null)

  const fetchBranding = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orgBrandingService.getBranding()
      setBranding(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar configurações de aparência'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchBranding() }, [fetchBranding])

  const saveBranding = useCallback(
    async (updates: Partial<Omit<OrgBranding, 'id' | 'orgId'>>) => {
      setSaving(true)
      try {
        const updated = await orgBrandingService.upsertBranding(updates)
        setBranding(updated)
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    const url = await orgBrandingService.uploadLogo(file)
    setBranding((prev) => ({ ...prev, logoUrl: url }))
    return url
  }, [])

  return { branding, loading, saving, error, saveBranding, uploadLogo, fetchBranding }
}
