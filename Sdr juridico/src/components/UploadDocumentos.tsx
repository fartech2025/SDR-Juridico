import * as React from 'react'
import { Upload, FileUp, Image, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { documentosService, formatarTamanhoArquivo, obterIconeArquivo } from '@/services/documentosService'

interface UploadDocumentosProps {
  casoId?: string
  onUploadComplete?: () => void
  className?: string
}

interface ArquivoUpload {
  arquivo: File
  progresso: number
  status: 'aguardando' | 'enviando' | 'sucesso' | 'erro'
  erro?: string
}

export function UploadDocumentos({ casoId, onUploadComplete, className }: UploadDocumentosProps) {
  const navigate = useNavigate()
  const [arquivos, setArquivos] = React.useState<ArquivoUpload[]>([])
  const [dragActive, setDragActive] = React.useState(false)
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)
  const inputFileRef = React.useRef<HTMLInputElement>(null)
  const inputCameraRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    checkAuthentication()
  }, [])

  async function checkAuthentication() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session?.user)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleArquivos(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleArquivos(Array.from(e.target.files))
    }
  }

  const handleArquivos = (novosArquivos: File[]) => {
    const arquivosValidos = novosArquivos.filter((arquivo) => {
      // Validar tamanho
      if (arquivo.size > 10 * 1024 * 1024) {
        toast.error(`${arquivo.name}: Arquivo muito grande (máx 10MB)`)
        return false
      }

      // Validar tipo
      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]

      if (!tiposPermitidos.includes(arquivo.type)) {
        toast.error(`${arquivo.name}: Tipo de arquivo não permitido`)
        return false
      }

      return true
    })

    const novosUploads: ArquivoUpload[] = arquivosValidos.map((arquivo) => ({
      arquivo,
      progresso: 0,
      status: 'aguardando',
    }))

    setArquivos((prev) => [...prev, ...novosUploads])

    // Iniciar uploads
    novosUploads.forEach((upload, index) => {
      fazerUpload(upload, arquivos.length + index)
    })
  }

  const fazerUpload = async (upload: ArquivoUpload, index: number) => {
    try {
      // Atualizar status para enviando
      setArquivos((prev) =>
        prev.map((a, i) =>
          i === index ? { ...a, status: 'enviando', progresso: 50 } : a
        )
      )

      // Fazer upload
      await documentosService.uploadDocumento({
        arquivo: upload.arquivo,
        casoId,
        categoria: 'geral',
      })

      // Sucesso
      setArquivos((prev) =>
        prev.map((a, i) =>
          i === index ? { ...a, status: 'sucesso', progresso: 100 } : a
        )
      )

      toast.success(`${upload.arquivo.name} enviado com sucesso!`)
      
      // Chamar callback se fornecido
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      // Erro
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido'
      setArquivos((prev) =>
        prev.map((a, i) =>
          i === index ? { ...a, status: 'erro', erro: mensagemErro } : a
        )
      )

      toast.error(`Erro ao enviar ${upload.arquivo.name}: ${mensagemErro}`)
    }
  }

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index))
  }

  const limparConcluidos = () => {
    setArquivos((prev) => prev.filter((a) => a.status !== 'sucesso'))
  }

  return (
    <div className={className}>
      {/* Aviso de não autenticado */}
      {isAuthenticated === false && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                Autenticação necessária
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Você precisa estar logado para fazer upload de documentos.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login', { state: { from: window.location.pathname } })}
            >
              Fazer Login
            </Button>
          </div>
        </Card>
      )}

      {/* Área de drop */}
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${isAuthenticated === false ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-text mb-2">
            Arraste arquivos aqui
          </h3>
          <p className="text-sm text-text-muted mb-4">
            ou clique nos botões abaixo para selecionar
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputFileRef.current?.click()}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Selecionar Arquivos
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => inputCameraRef.current?.click()}
            >
              <Image className="h-4 w-4 mr-2" />
              Tirar Foto
            </Button>
          </div>

          {/* Input para selecionar arquivos */}
          <input
            ref={inputFileRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
            accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
          />

          {/* Input para capturar foto */}
          <input
            ref={inputCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInput}
          />

          <p className="text-xs text-text-muted mt-4">
            Formatos aceitos: PDF, Imagens (JPG, PNG, WebP, HEIC), Word, Excel
            <br />
            Tamanho máximo: 10MB por arquivo
          </p>
        </div>
      </Card>

      {/* Lista de arquivos */}
      {arquivos.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-text">
              Arquivos ({arquivos.length})
            </h4>
            {arquivos.some((a) => a.status === 'sucesso') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparConcluidos}
                className="text-xs"
              >
                Limpar concluídos
              </Button>
            )}
          </div>

          {arquivos.map((upload, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                {/* Ícone do arquivo */}
                <div className="text-2xl">
                  {obterIconeArquivo(upload.arquivo.type)}
                </div>

                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {upload.arquivo.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatarTamanhoArquivo(upload.arquivo.size)}
                  </p>

                  {/* Barra de progresso */}
                  {upload.status === 'enviando' && (
                    <div className="mt-2 h-1 w-full bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${upload.progresso}%` }}
                      />
                    </div>
                  )}

                  {/* Mensagem de erro */}
                  {upload.status === 'erro' && upload.erro && (
                    <p className="text-xs text-red-500 mt-1">{upload.erro}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {upload.status === 'aguardando' && (
                    <span className="text-xs text-text-muted">Aguardando...</span>
                  )}
                  {upload.status === 'enviando' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {upload.status === 'sucesso' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {upload.status === 'erro' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fazerUpload(upload, index)}
                      className="text-xs"
                    >
                      Tentar novamente
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerArquivo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
