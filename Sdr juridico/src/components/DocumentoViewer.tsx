import * as React from 'react'
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'

type DocumentoStatus = 'pendente' | 'solicitado' | 'aprovado' | 'rejeitado' | 'completo'

interface DocumentoViewerProps {
  isOpen: boolean
  onClose: () => void
  url: string
  titulo: string
  fileName?: string
  status?: DocumentoStatus
  onDownload?: () => void
  onAprovar?: () => Promise<void>
  onRejeitar?: () => Promise<void>
  onSolicitar?: () => Promise<void>
}

const statusConfig: Record<DocumentoStatus, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
  solicitado: { label: 'Solicitado', className: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-100 text-red-700' },
  completo: { label: 'Completo', className: 'bg-green-100 text-green-700' },
}

export function DocumentoViewer({
  isOpen,
  onClose,
  url,
  titulo,
  fileName,
  status,
  onDownload,
  onAprovar,
  onRejeitar,
  onSolicitar,
}: DocumentoViewerProps) {
  const [zoom, setZoom] = React.useState(100)
  const [rotation, setRotation] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<'aprovar' | 'rejeitar' | 'solicitar' | null>(null)

  // Detecta tipo de arquivo pela URL ou fileName
  const fileType = React.useMemo(() => {
    const name = (fileName || url || '').toLowerCase()
    if (name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/)) return 'image'
    if (name.match(/\.pdf(\?|$)/)) return 'pdf'
    if (name.match(/\.(doc|docx)(\?|$)/)) return 'word'
    if (name.match(/\.(xls|xlsx)(\?|$)/)) return 'excel'
    return 'unknown'
  }, [url, fileName])

  // Reset states quando abre
  React.useEffect(() => {
    if (isOpen) {
      setZoom(100)
      setRotation(0)
      setLoading(true)
      setError(false)
    }
  }, [isOpen, url])

  // Fecha com ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 200))
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 50))
  const handleRotate = () => setRotation(r => (r + 90) % 360)

  const handleOpenExternal = () => {
    window.open(url, '_blank')
  }

  const handleAprovar = async () => {
    if (!onAprovar || actionLoading) return
    setActionLoading('aprovar')
    try {
      await onAprovar()
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejeitar = async () => {
    if (!onRejeitar || actionLoading) return
    setActionLoading('rejeitar')
    try {
      await onRejeitar()
    } finally {
      setActionLoading(null)
    }
  }

  const handleSolicitar = async () => {
    if (!onSolicitar || actionLoading) return
    setActionLoading('solicitar')
    try {
      await onSolicitar()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 truncate max-w-md">
              {titulo}
            </h3>
            {fileName && (
              <span className="text-sm text-gray-500 truncate max-w-xs">
                ({fileName})
              </span>
            )}
            {status && (
              <span className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                statusConfig[status].className
              )}>
                {statusConfig[status].label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de zoom (só para imagens) */}
            {fileType === 'image' && (
              <>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500 w-12 text-center">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Rotacionar"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-1" />
              </>
            )}

            {/* Abrir externamente */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            {/* Download */}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-cyan-50 hover:text-cyan-600"
                title="Baixar documento"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 mx-1" />

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
              title="Fechar (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                <span className="text-sm text-gray-500">Carregando documento...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-red-100 p-4">
                  <X className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-gray-700 font-medium">Não foi possível carregar o documento</p>
                <p className="text-sm text-gray-500">
                  Tente abrir em uma nova aba ou fazer o download
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir em nova aba
                  </button>
                  {onDownload && (
                    <button
                      type="button"
                      onClick={onDownload}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Renderização por tipo */}
          {fileType === 'image' && (
            <div
              className={cn(
                'flex h-full items-center justify-center transition-opacity duration-300',
                loading ? 'opacity-0' : 'opacity-100'
              )}
            >
              <img
                src={url}
                alt={titulo}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setError(true)
                }}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                }}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          {fileType === 'pdf' && (
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              title={titulo}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
              className={cn(
                'h-full w-full rounded-lg border border-gray-200 bg-white transition-opacity duration-300',
                loading ? 'opacity-0' : 'opacity-100'
              )}
            />
          )}

          {(fileType === 'word' || fileType === 'excel' || fileType === 'unknown') && !error && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-gray-200 p-6">
                  <Download className="h-12 w-12 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">
                    Este tipo de arquivo não pode ser visualizado no navegador
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Faça o download para abrir no aplicativo correspondente
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir em nova aba
                  </button>
                  {onDownload && (
                    <button
                      type="button"
                      onClick={onDownload}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações de status */}
        {(onAprovar || onRejeitar || onSolicitar) && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-500">
              Revise o documento e atualize o status
            </div>
            <div className="flex items-center gap-2">
              {onSolicitar && (
                <button
                  type="button"
                  onClick={() => void handleSolicitar()}
                  disabled={!!actionLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'bg-blue-50 text-blue-700 hover:bg-blue-100',
                    actionLoading === 'solicitar' && 'opacity-70 cursor-wait'
                  )}
                >
                  {actionLoading === 'solicitar' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Solicitar Novamente
                </button>
              )}
              {onRejeitar && (
                <button
                  type="button"
                  onClick={() => void handleRejeitar()}
                  disabled={!!actionLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'bg-red-50 text-red-700 hover:bg-red-100',
                    actionLoading === 'rejeitar' && 'opacity-70 cursor-wait'
                  )}
                >
                  {actionLoading === 'rejeitar' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  Rejeitar
                </button>
              )}
              {onAprovar && (
                <button
                  type="button"
                  onClick={() => void handleAprovar()}
                  disabled={!!actionLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    'bg-green-500 text-white hover:bg-green-600',
                    actionLoading === 'aprovar' && 'opacity-70 cursor-wait'
                  )}
                >
                  {actionLoading === 'aprovar' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Aprovar Documento
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
