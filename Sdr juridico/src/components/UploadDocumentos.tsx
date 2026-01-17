import * as React from 'react'
import { Upload, FileUp, Image, X, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { documentosService, formatarTamanhoArquivo, obterIconeArquivo } from '@/services/documentosService'
import { FormularioContestacao } from '@/components/FormularioContestacao'
import { FormularioContrato } from '@/components/FormularioContrato'

interface UploadDocumentosProps {
  casoId?: string
  orgId?: string
  onUploadComplete?: () => void
  className?: string
  disabled?: boolean
}

interface ArquivoUpload {
  arquivo: File
  progresso: number
  status: 'aguardando' | 'enviando' | 'sucesso' | 'erro'
  erro?: string
}

interface DadosProcuracao {
  tipo: string
  status: string
  numeroId: string
  dataDocumento: string
  dataAssinatura: string
  validade: string
  dataExpiracao: string
  outorgante: {
    nome: string
    cpfCnpj: string
    rgIe: string
    endereco: string
    email: string
    telefone: string
  }
  outorgados: Array<{
    nome: string
    oab: string
    uf: string
    cpf: string
    sociedade: string
  }>
  poderesPrincipais: string[]
  poderesEspeciais: string
  limitacoes: string
  orgaoCompetencia: string
  processosVinculados: string
  areaDireito: string
  finalidade: string
  tipoAssinatura: string
  assinantes: string
  evidencias: string
  reconhecimentoFirma: boolean
  cartorio: string
  testemunhas: string
}

interface DadosContestacao {
  status: string
  numeroProcesso: string
  classeProcessual: string
  varaOrgao: string
  comarca: string
  areaDireito: string
  dataCriacao: string
  dataProtocolo: string
  prazoFinal: string
  situacaoPrazo: string
  autores: Array<{
    nome: string
    cpfCnpj: string
  }>
  reus: Array<{
    nome: string
    cpfCnpj: string
  }>
  advogadosReu: Array<{
    nome: string
    oab: string
    uf: string
  }>
  advogadosContrarios: string
  resumoPeticaoInicial: string
  pedidosAutor: string[]
  valorCausa: string
  riscoJuridico: string
  impactoFinanceiro: string
  probabilidadeAcordo: string
  tesePrincipais: string[]
  tesePreliminares: string
  teseMerito: string
  jurisprudencias: Array<{
    tribunal: string
    numeroProcesso: string
    ementa: string
  }>
  fundamentacaoLegal: string
  pedidosContestacao: string[]
  documentosAnexados: Array<{
    tipo: string
    origem: string
  }>
  documentosPendentes: string[]
  validacaoInterna: string
  tipoProvaRequerida: string[]
  testemunhas: Array<{
    nome: string
    cpf: string
    contato: string
    observacoes: string
  }>
  meioProtocolo: string
  numeroProtocolo: string
  comprovanteAnexado: boolean
  confirmacaoProtocolo: boolean
  usuarioProtocolo: string
  dataHoraEnvio: string
}

interface DadosContrato {
  tipoContrato: string
  subtipoContrato: string
  status: string
  numeroContrato: string
  dataEmissao: string
  dataAssinatura: string
  dataInicio: string
  dataTermino: string
  prazoVigencia: string
  renovacaoAutomatica: boolean
  partes: Array<{
    tipo: string
    nome: string
    cpfCnpj: string
    endereco: string
    email: string
    telefone: string
    representante: string
  }>
  objetoContrato: string
  valorTotal: string
  formaPagamento: string
  parcelas: string
  dataVencimento: string
  reajuste: string
  indiceReajuste: string
  honorariosFixo: string
  honorariosExito: string
  percentualExito: string
  valorMinimoGarantido: string
  garantias: string[]
  tipoGarantia: string
  clausulasEspecificas: string
  clausulaRescisao: string
  multaRescisoria: string
  clausulaNaoConcorrencia: string
  sla: string
  escopo: string
  limitesHoras: string
  propriedadeIntelectual: string
  confidencialidade: boolean
  foro: string
  legislacaoAplicavel: string
  tipoAssinatura: string
  assinantes: string
  reconhecimentoFirma: boolean
  cartorio: string
  vinculacaoCliente: string
  vinculacaoCaso: string
  vinculacaoHonorarios: string
  alertaVencimento: boolean
  diasAntesAlerta: string
  alertaReajuste: boolean
  observacoes: string
}

export function UploadDocumentos({ casoId, orgId, onUploadComplete, className, disabled = false }: UploadDocumentosProps) {
  const [arquivos, setArquivos] = React.useState<ArquivoUpload[]>([])
  const [dragActive, setDragActive] = React.useState(false)
  const [tipoDocumento, setTipoDocumento] = React.useState('')
  const [observacao, setObservacao] = React.useState('')
  const [dadosProcuracao, setDadosProcuracao] = React.useState<DadosProcuracao>({
    tipo: '',
    status: 'rascunho',
    numeroId: '',
    dataDocumento: '',
    dataAssinatura: '',
    validade: 'indeterminada',
    dataExpiracao: '',
    outorgante: { nome: '', cpfCnpj: '', rgIe: '', endereco: '', email: '', telefone: '' },
    outorgados: [{ nome: '', oab: '', uf: '', cpf: '', sociedade: '' }],
    poderesPrincipais: [],
    poderesEspeciais: '',
    limitacoes: '',
    orgaoCompetencia: '',
    processosVinculados: '',
    areaDireito: '',
    finalidade: '',
    tipoAssinatura: '',
    assinantes: '',
    evidencias: '',
    reconhecimentoFirma: false,
    cartorio: '',
    testemunhas: '',
  })
  const [dadosContestacao, setDadosContestacao] = React.useState<DadosContestacao>({
    status: 'rascunho',
    numeroProcesso: '',
    classeProcessual: '',
    varaOrgao: '',
    comarca: '',
    areaDireito: '',
    dataCriacao: '',
    dataProtocolo: '',
    prazoFinal: '',
    situacaoPrazo: 'no_prazo',
    autores: [{ nome: '', cpfCnpj: '' }],
    reus: [{ nome: '', cpfCnpj: '' }],
    advogadosReu: [{ nome: '', oab: '', uf: '' }],
    advogadosContrarios: '',
    resumoPeticaoInicial: '',
    pedidosAutor: [],
    valorCausa: '',
    riscoJuridico: 'medio',
    impactoFinanceiro: '',
    probabilidadeAcordo: '',
    tesePrincipais: [],
    tesePreliminares: '',
    teseMerito: '',
    jurisprudencias: [],
    fundamentacaoLegal: '',
    pedidosContestacao: [],
    documentosAnexados: [],
    documentosPendentes: [],
    validacaoInterna: 'pendente',
    tipoProvaRequerida: [],
    testemunhas: [],
    meioProtocolo: '',
    numeroProtocolo: '',
    comprovanteAnexado: false,
    confirmacaoProtocolo: false,
    usuarioProtocolo: '',
    dataHoraEnvio: '',
  })
  const [dadosContrato, setDadosContrato] = React.useState<DadosContrato>({
    tipoContrato: '',
    subtipoContrato: '',
    status: 'rascunho',
    numeroContrato: '',
    dataEmissao: '',
    dataAssinatura: '',
    dataInicio: '',
    dataTermino: '',
    prazoVigencia: '',
    renovacaoAutomatica: false,
    partes: [{ tipo: '', nome: '', cpfCnpj: '', endereco: '', email: '', telefone: '', representante: '' }],
    objetoContrato: '',
    valorTotal: '',
    formaPagamento: '',
    parcelas: '',
    dataVencimento: '',
    reajuste: '',
    indiceReajuste: '',
    honorariosFixo: '',
    honorariosExito: '',
    percentualExito: '',
    valorMinimoGarantido: '',
    garantias: [],
    tipoGarantia: '',
    clausulasEspecificas: '',
    clausulaRescisao: '',
    multaRescisoria: '',
    clausulaNaoConcorrencia: '',
    sla: '',
    escopo: '',
    limitesHoras: '',
    propriedadeIntelectual: '',
    confidencialidade: false,
    foro: '',
    legislacaoAplicavel: '',
    tipoAssinatura: '',
    assinantes: '',
    reconhecimentoFirma: false,
    cartorio: '',
    vinculacaoCliente: '',
    vinculacaoCaso: '',
    vinculacaoHonorarios: '',
    alertaVencimento: false,
    diasAntesAlerta: '',
    alertaReajuste: false,
    observacoes: '',
  })
  const inputFileRef = React.useRef<HTMLInputElement>(null)
  const inputCameraRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleArquivos(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.target.files && e.target.files.length > 0) {
      handleArquivos(Array.from(e.target.files))
    }
  }

  const handleArquivos = (novosArquivos: File[]) => {
    if (disabled) {
      toast.error('Voce nao tem permissao para enviar documentos.')
      return
    }
    // Validar se tipo de documento foi selecionado
    if (!tipoDocumento) {
      toast.error('Por favor, selecione o tipo de documento antes de fazer o upload')
      return
    }

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

      // Preparar descrição com dados da procuração, contestação ou contrato se aplicável
      let descricaoCompleta = observacao || ''
      if (tipoDocumento === 'procuracao') {
        descricaoCompleta = JSON.stringify({ observacao, dadosProcuracao })
      } else if (tipoDocumento === 'contestacao') {
        descricaoCompleta = JSON.stringify({ observacao, dadosContestacao })
      } else if (tipoDocumento === 'contrato') {
        descricaoCompleta = JSON.stringify({ observacao, dadosContrato })
      }

      // Fazer upload
      await documentosService.uploadDocumento({
        arquivo: upload.arquivo,
        casoId,
        orgId,
        categoria: tipoDocumento || 'geral',
        descricao: descricaoCompleta || undefined,
      })

      // Sucesso
      setArquivos((prev) =>
        prev.map((a, i) =>
          i === index ? { ...a, status: 'sucesso', progresso: 100 } : a
        )
      )

      toast.success(`${upload.arquivo.name} enviado com sucesso!`)
      
      // Limpar campos se todos os uploads foram concluídos
      const todosCompletos = arquivos.every((a, i) => 
        i === index ? true : a.status === 'sucesso' || a.status === 'erro'
      )
      if (todosCompletos) {
        setTipoDocumento('')
        setObservacao('')
      }
      
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
      {/* Campos de informação do documento */}
      <div>
        <Card className="mb-4 p-4 space-y-4">
          <div>
            <label htmlFor="tipoDocumento" className="block text-sm font-medium text-text mb-2">
              Tipo de Documento *
            </label>
            <select
              id="tipoDocumento"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione o tipo</option>
              <option value="peticao_inicial">Petição Inicial</option>
              <option value="contestacao">Contestação</option>
              <option value="recurso">Recurso</option>
              <option value="procuracao">Procuração</option>
              <option value="contrato">Contrato</option>
              <option value="documento_pessoal">Documento Pessoal</option>
              <option value="comprovante">Comprovante</option>
              <option value="laudo">Laudo/Perícia</option>
              <option value="sentenca">Sentença</option>
              <option value="acordo">Acordo</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="observacao" className="block text-sm font-medium text-text mb-2">
              Observação
            </label>
            <textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione observações sobre este documento (opcional)"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </Card>
      </div>

      {/* Campos específicos para Procuração */}
      {tipoDocumento === 'procuracao' && (
        <div className="space-y-4 mb-4">
          {/* 1) Identificação rápida */}
          <Card className="p-4 space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-border pb-2">
              1. Identificação Rápida
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tipo de Procuração *
                </label>
                <select
                  value={dadosProcuracao.tipo}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione</option>
                  <option value="judicial">Judicial</option>
                  <option value="extrajudicial">Extrajudicial</option>
                  <option value="ad_judicia">Ad Judicia</option>
                  <option value="ad_judicia_et_extra">Ad Judicia et Extra</option>
                  <option value="substabelecimento">Substabelecimento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Status
                </label>
                <select
                  value={dadosProcuracao.status}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviada">Enviada</option>
                  <option value="assinada">Assinada</option>
                  <option value="valida">Válida</option>
                  <option value="vencida">Vencida</option>
                  <option value="revogada">Revogada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Número/ID Interno
                </label>
                <input
                  type="text"
                  value={dadosProcuracao.numeroId}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, numeroId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Data do Documento
                </label>
                <input
                  type="date"
                  value={dadosProcuracao.dataDocumento}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, dataDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Data de Assinatura
                </label>
                <input
                  type="date"
                  value={dadosProcuracao.dataAssinatura}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, dataAssinatura: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Validade
                </label>
                <select
                  value={dadosProcuracao.validade}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, validade: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="indeterminada">Indeterminada</option>
                  <option value="por_prazo">Por Prazo</option>
                </select>
              </div>

              {dadosProcuracao.validade === 'por_prazo' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={dadosProcuracao.dataExpiracao}
                    onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, dataExpiracao: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* 2) Partes e poderes */}
          <Card className="p-4 space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-border pb-2">
              2. Partes e Poderes
            </h3>
            
            {/* Outorgante */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text">Outorgante (Cliente)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Nome/Razão Social</label>
                  <input
                    type="text"
                    value={dadosProcuracao.outorgante.nome}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, nome: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={dadosProcuracao.outorgante.cpfCnpj}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, cpfCnpj: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">RG/IE</label>
                  <input
                    type="text"
                    value={dadosProcuracao.outorgante.rgIe}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, rgIe: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Endereço</label>
                  <input
                    type="text"
                    value={dadosProcuracao.outorgante.endereco}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, endereco: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">E-mail</label>
                  <input
                    type="email"
                    value={dadosProcuracao.outorgante.email}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={dadosProcuracao.outorgante.telefone}
                    onChange={(e) => setDadosProcuracao({
                      ...dadosProcuracao,
                      outorgante: { ...dadosProcuracao.outorgante, telefone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Outorgados */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text">Outorgado(s) (Advogados)</h4>
              {dadosProcuracao.outorgados.map((outorgado, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Nome</label>
                      <input
                        type="text"
                        value={outorgado.nome}
                        onChange={(e) => {
                          const novos = [...dadosProcuracao.outorgados]
                          novos[idx].nome = e.target.value
                          setDadosProcuracao({ ...dadosProcuracao, outorgados: novos })
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">OAB</label>
                      <input
                        type="text"
                        value={outorgado.oab}
                        onChange={(e) => {
                          const novos = [...dadosProcuracao.outorgados]
                          novos[idx].oab = e.target.value
                          setDadosProcuracao({ ...dadosProcuracao, outorgados: novos })
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">UF</label>
                      <input
                        type="text"
                        value={outorgado.uf}
                        onChange={(e) => {
                          const novos = [...dadosProcuracao.outorgados]
                          novos[idx].uf = e.target.value
                          setDadosProcuracao({ ...dadosProcuracao, outorgados: novos })
                        }}
                        maxLength={2}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">CPF (opcional)</label>
                      <input
                        type="text"
                        value={outorgado.cpf}
                        onChange={(e) => {
                          const novos = [...dadosProcuracao.outorgados]
                          novos[idx].cpf = e.target.value
                          setDadosProcuracao({ ...dadosProcuracao, outorgados: novos })
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-text-muted mb-1">Sociedade de Advogados</label>
                      <input
                        type="text"
                        value={outorgado.sociedade}
                        onChange={(e) => {
                          const novos = [...dadosProcuracao.outorgados]
                          novos[idx].sociedade = e.target.value
                          setDadosProcuracao({ ...dadosProcuracao, outorgados: novos })
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {dadosProcuracao.outorgados.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDadosProcuracao({
                          ...dadosProcuracao,
                          outorgados: dadosProcuracao.outorgados.filter((_, i) => i !== idx)
                        })
                      }}
                      className="text-xs text-red-500"
                    >
                      <X className="h-3 w-3 mr-1" /> Remover
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDadosProcuracao({
                    ...dadosProcuracao,
                    outorgados: [...dadosProcuracao.outorgados, { nome: '', oab: '', uf: '', cpf: '', sociedade: '' }]
                  })
                }}
              >
                + Adicionar Outorgado
              </Button>
            </div>

            {/* Poderes */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Poderes Principais</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['receber e dar quitação', 'confessar', 'transigir', 'firmar compromisso', 
                    'substabelecer', 'representar em audiência', 'levantamento de valores/alvará', 
                    'representação administrativa', 'propositura de ação'].map((poder) => (
                    <label key={poder} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={dadosProcuracao.poderesPrincipais.includes(poder)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDadosProcuracao({
                              ...dadosProcuracao,
                              poderesPrincipais: [...dadosProcuracao.poderesPrincipais, poder]
                            })
                          } else {
                            setDadosProcuracao({
                              ...dadosProcuracao,
                              poderesPrincipais: dadosProcuracao.poderesPrincipais.filter(p => p !== poder)
                            })
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-text">{poder}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Poderes Especiais</label>
                <textarea
                  value={dadosProcuracao.poderesEspeciais}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, poderesEspeciais: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Descreva poderes especiais específicos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Limitações/Ressalvas</label>
                <textarea
                  value={dadosProcuracao.limitacoes}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, limitacoes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Ex: vedado substabelecer, somente INSS, somente processo X"
                />
              </div>
            </div>
          </Card>

          {/* 3) Contexto do uso */}
          <Card className="p-4 space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-border pb-2">
              3. Contexto do Uso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Órgão/Competência</label>
                <input
                  type="text"
                  value={dadosProcuracao.orgaoCompetencia}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, orgaoCompetencia: e.target.value })}
                  placeholder="Ex: JT, JF, TJ, TRF, Juizado"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Área do Direito</label>
                <input
                  type="text"
                  value={dadosProcuracao.areaDireito}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, areaDireito: e.target.value })}
                  placeholder="Ex: cível, trabalhista, previdenciário"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Processos Vinculados (CNJs)</label>
                <textarea
                  value={dadosProcuracao.processosVinculados}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, processosVinculados: e.target.value })}
                  rows={2}
                  placeholder="Liste os números de processo CNJ separados por vírgula"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Finalidade</label>
                <input
                  type="text"
                  value={dadosProcuracao.finalidade}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, finalidade: e.target.value })}
                  placeholder="Ex: ajuizamento, acompanhamento, acordo, alvará"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* 4) Assinaturas e autenticação */}
          <Card className="p-4 space-y-4">
            <h3 className="text-base font-semibold text-text border-b border-border pb-2">
              4. Assinaturas e Autenticação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Tipo de Assinatura</label>
                <select
                  value={dadosProcuracao.tipoAssinatura}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, tipoAssinatura: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione</option>
                  <option value="manuscrita">Manuscrita</option>
                  <option value="icp_brasil">ICP-Brasil</option>
                  <option value="govbr">Gov.br</option>
                  <option value="docusign">DocuSign</option>
                  <option value="clicksign">Clicksign</option>
                  <option value="outra">Outra Plataforma</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reconhecimentoFirma"
                  checked={dadosProcuracao.reconhecimentoFirma}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, reconhecimentoFirma: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="reconhecimentoFirma" className="text-sm font-medium text-text">
                  Reconhecimento de Firma
                </label>
              </div>

              {dadosProcuracao.reconhecimentoFirma && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text mb-2">Cartório</label>
                  <input
                    type="text"
                    value={dadosProcuracao.cartorio}
                    onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, cartorio: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Assinantes (nome + documento + data)</label>
                <textarea
                  value={dadosProcuracao.assinantes}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, assinantes: e.target.value })}
                  rows={2}
                  placeholder="Liste quem assinou, documentos e datas"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Evidências (certificado, hash, trilha)</label>
                <textarea
                  value={dadosProcuracao.evidencias}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, evidencias: e.target.value })}
                  rows={2}
                  placeholder="Informações sobre certificados, hash, carimbo do tempo, etc"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Testemunhas (nome + CPF)</label>
                <textarea
                  value={dadosProcuracao.testemunhas}
                  onChange={(e) => setDadosProcuracao({ ...dadosProcuracao, testemunhas: e.target.value })}
                  rows={2}
                  placeholder="Liste as testemunhas com seus CPFs"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Campos específicos para Contestação */}
      {tipoDocumento === 'contestacao' && (
        <FormularioContestacao 
          dados={dadosContestacao} 
          onChange={setDadosContestacao} 
        />
      )}

      {/* Campos específicos para Contrato */}
      {tipoDocumento === 'contrato' && (
        <FormularioContrato 
          dados={dadosContrato} 
          onChange={setDadosContrato} 
        />
      )}

      {/* Área de drop */}
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
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
              disabled={disabled}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Selecionar Arquivos
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => inputCameraRef.current?.click()}
              disabled={disabled}
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
            disabled={disabled}
          />

          {/* Input para capturar foto */}
          <input
            ref={inputCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />

          <p className="text-xs text-text-muted mt-4">
            Formatos aceitos: PDF, Imagens (JPG, PNG, WebP), Word, Excel
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
