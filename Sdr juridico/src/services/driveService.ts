import { integrationsService } from './integrationsService'

export type DriveProvider = 'google_drive' | 'onedrive'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink?: string
}

export interface DriveUploadResult {
  fileId: string
  webViewLink: string
}

// ── Token helpers ──────────────────────────────────────────────────────────────
async function getAccessToken(provider: DriveProvider): Promise<string | null> {
  const integrations = await integrationsService.getIntegrations()
  const intProviderKey = provider === 'google_drive' ? 'google_calendar' : 'teams'
  const integration = integrations.find((i) => i.provider === intProviderKey && i.enabled)
  if (!integration?.secrets) return null
  return (integration.secrets as Record<string, string>).access_token ?? null
}

// ── Drive Service ──────────────────────────────────────────────────────────────
export const driveService = {
  async isConnected(provider: DriveProvider): Promise<boolean> {
    const token = await getAccessToken(provider)
    return token !== null
  },

  async listFiles(provider: DriveProvider, query?: string): Promise<DriveFile[]> {
    const token = await getAccessToken(provider)
    if (!token) throw new Error('Drive não conectado')

    if (provider === 'google_drive') {
      const mimeFilter =
        "mimeType='application/vnd.google-apps.document' or " +
        "mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'"
      const q = query ? `(${mimeFilter}) and name contains '${query.replace(/'/g, "\\'")}'` : mimeFilter
      const url =
        `https://www.googleapis.com/drive/v3/files` +
        `?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)` +
        `&orderBy=modifiedTime+desc&pageSize=20`
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) throw new Error('Erro ao listar arquivos do Google Drive')
      const json = (await resp.json()) as { files?: DriveFile[] }
      return json.files ?? []
    } else {
      const url = query
        ? `https://graph.microsoft.com/v1.0/me/drive/search(q='${encodeURIComponent(query)}')?$top=20`
        : `https://graph.microsoft.com/v1.0/me/drive/recent?$top=20`
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) throw new Error('Erro ao listar arquivos do OneDrive')
      const json = (await resp.json()) as { value?: Record<string, unknown>[] }
      return (json.value ?? []).map((f) => ({
        id: f.id as string,
        name: f.name as string,
        mimeType: (f.file as Record<string, unknown>)?.mimeType as string ?? '',
        modifiedTime: f.lastModifiedDateTime as string,
        webViewLink: f.webUrl as string,
      }))
    }
  },

  async exportAsHtml(provider: DriveProvider, fileId: string): Promise<string> {
    const token = await getAccessToken(provider)
    if (!token) throw new Error('Drive não conectado')

    if (provider === 'google_drive') {
      const resp = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text%2Fhtml`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!resp.ok) throw new Error('Erro ao exportar arquivo do Google Drive')
      return resp.text()
    } else {
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content?format=html`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!resp.ok) throw new Error('Erro ao exportar arquivo do OneDrive')
      return resp.text()
    }
  },

  async uploadPdf(
    provider: DriveProvider,
    blob: Blob,
    fileName: string,
    folderId?: string,
  ): Promise<DriveUploadResult> {
    const token = await getAccessToken(provider)
    if (!token) throw new Error('Drive não conectado')

    if (provider === 'google_drive') {
      const metadata: Record<string, unknown> = { name: fileName, mimeType: 'application/pdf' }
      if (folderId) metadata.parents = [folderId]
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', blob, fileName)
      const resp = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
      )
      if (!resp.ok) throw new Error('Erro ao fazer upload para o Google Drive')
      const json = (await resp.json()) as { id: string; webViewLink: string }
      return { fileId: json.id, webViewLink: json.webViewLink }
    } else {
      const baseUrl = folderId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodeURIComponent(fileName)}:/content`
        : `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`
      const resp = await fetch(baseUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' },
        body: blob,
      })
      if (!resp.ok) throw new Error('Erro ao fazer upload para o OneDrive')
      const json = (await resp.json()) as { id: string; webUrl: string }
      return { fileId: json.id, webViewLink: json.webUrl }
    }
  },

  // Cria (ou recupera) uma pasta no Drive. Retorna o folderId.
  async ensureFolder(provider: DriveProvider, folderName: string, parentId?: string): Promise<string> {
    const token = await getAccessToken(provider)
    if (!token) throw new Error('Drive não conectado')

    if (provider === 'google_drive') {
      const parentFilter = parentId ? ` and '${parentId}' in parents` : ''
      const q = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder'${parentFilter} and trashed=false`
      const searchResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (searchResp.ok) {
        const json = (await searchResp.json()) as { files?: { id: string }[] }
        if ((json.files?.length ?? 0) > 0) return json.files![0].id
      }
      const metadata: Record<string, unknown> = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }
      if (parentId) metadata.parents = [parentId]
      const createResp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })
      if (!createResp.ok) throw new Error('Erro ao criar pasta no Google Drive')
      const json = (await createResp.json()) as { id: string }
      return json.id
    } else {
      const checkUrl = parentId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}:/${encodeURIComponent(folderName)}`
        : `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderName)}`
      const checkResp = await fetch(checkUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (checkResp.ok) {
        const json = (await checkResp.json()) as { id: string }
        return json.id
      }
      const parentUrl = parentId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`
        : 'https://graph.microsoft.com/v1.0/me/drive/root/children'
      const createResp = await fetch(parentUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' }),
      })
      if (!createResp.ok) throw new Error('Erro ao criar pasta no OneDrive')
      const json = (await createResp.json()) as { id: string }
      return json.id
    }
  },
}
