import React, { useState, useEffect } from 'react'
import { Search, FileText, Loader2, MonitorDot, Chrome, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { driveService } from '@/services/driveService'
import { driveImportService } from '@/services/driveImportService'
import type { DriveProvider, DriveFile } from '@/services/driveService'

interface Props {
  open: boolean
  onClose: () => void
  onImport: (html: string) => void
}

type ProviderMeta = {
  key: DriveProvider
  label: string
  icon: React.ReactNode
}

const PROVIDERS: ProviderMeta[] = [
  { key: 'google_drive', label: 'Google Drive', icon: <Chrome className="h-5 w-5" style={{ color: '#4285F4' }} /> },
  { key: 'onedrive',     label: 'OneDrive',     icon: <MonitorDot className="h-5 w-5" style={{ color: '#0078D4' }} /> },
]

export function DrivePickerModal({ open, onClose, onImport }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<DriveProvider | null>(null)
  const [connectedMap, setConnectedMap]           = useState<Record<DriveProvider, boolean>>({ google_drive: false, onedrive: false })
  const [files,    setFiles]    = useState<DriveFile[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [importing, setImporting] = useState<string | null>(null) // fileId being imported
  const [error,    setError]    = useState<string | null>(null)

  // Verifica quais provedores estão conectados ao abrir
  useEffect(() => {
    if (!open) return
    setSelectedProvider(null)
    setFiles([])
    setSearch('')
    setError(null)
    void (async () => {
      const [google, onedrive] = await Promise.all([
        driveService.isConnected('google_drive'),
        driveService.isConnected('onedrive'),
      ])
      setConnectedMap({ google_drive: google, onedrive: onedrive })
    })()
  }, [open])

  // Carrega arquivos ao selecionar provedor
  useEffect(() => {
    if (!selectedProvider) return
    void loadFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider])

  async function loadFiles(query?: string) {
    if (!selectedProvider) return
    setLoading(true)
    setError(null)
    try {
      const result = await driveService.listFiles(selectedProvider, query || undefined)
      setFiles(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao listar arquivos')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(file: DriveFile) {
    if (!selectedProvider) return
    setImporting(file.id)
    setError(null)
    try {
      const html = await driveImportService.importFileAsHtml(file.id, selectedProvider)
      onImport(html)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao importar arquivo')
    } finally {
      setImporting(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar documento do Drive" maxWidth="42rem">
      <div className="space-y-4">
        {/* Seletor de provedor */}
        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map((p) => {
            const connected  = connectedMap[p.key]
            const isSelected = selectedProvider === p.key
            return (
              <button
                key={p.key}
                onClick={() => connected && setSelectedProvider(p.key)}
                disabled={!connected}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? ''
                    : connected
                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'cursor-not-allowed border-gray-100 opacity-40'
                }`}
                style={isSelected ? { border: '2px solid #721011', backgroundColor: 'rgba(114,16,17,0.05)' } : {}}
              >
                {p.icon}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {connected ? 'Conectado' : 'Configure em Configurações → Integrações'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Browser de arquivos */}
        {selectedProvider && (
          <>
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void loadFiles(search) }}
                placeholder="Buscar por nome..."
              />
              <Button variant="outline" onClick={() => void loadFiles(search)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando arquivos...
              </div>
            ) : files.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum arquivo encontrado.</p>
            ) : (
              <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(file.modifiedTime).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleImport(file)}
                      disabled={importing !== null}
                      className="text-xs shrink-0"
                    >
                      {importing === file.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {importing && (
              <p className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Convertendo documento para o editor...
              </p>
            )}
          </>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  )
}
