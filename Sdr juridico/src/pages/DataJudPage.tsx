import * as React from 'react'
import { Search, RefreshCw, AlertCircle, Database, FileText, Users, Calendar, FileDown, Bug } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

import { BotaoFavorito } from '@/components/BotaoFavorito'
import { registrarConsulta } from '@/services/favoritosService'

import heroLight from '@/assets/hero-light.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  isDataJudConfigured,
  testarConexao,
  buscarProcessosPorParte,
  buscarProcessosPorClasse,
  buscarProcessosPorCpfCnpj,
  buscarProcessosPorCpfMultiTribunal,
  buscaAvancada,
  extrairInfoProcesso,
  buscarProcessoAutomatico,
  formatarNumeroProcesso,
  debugAuthState,
  detectarTribunalPorNumero,
  type ProcessoDataJud,
} from '@/services/datajudService'
import { cn } from '@/utils/cn'

type TipoBusca = 'numero' | 'cpf' | 'parte' | 'classe' | 'avancada'

const tribunais = [
  // Tribunais Superiores (4)
  { id: 'stj', nome: 'STJ - Superior Tribunal de Justiça' },
  { id: 'tst', nome: 'TST - Tribunal Superior do Trabalho' },
  { id: 'tse', nome: 'TSE - Tribunal Superior Eleitoral' },
  { id: 'stm', nome: 'STM - Superior Tribunal Militar' },
  
  // Tribunais Regionais Federais (6)
  { id: 'trf1', nome: 'TRF1 - Tribunal Regional Federal 1ª Região' },
  { id: 'trf2', nome: 'TRF2 - Tribunal Regional Federal 2ª Região' },
  { id: 'trf3', nome: 'TRF3 - Tribunal Regional Federal 3ª Região' },
  { id: 'trf4', nome: 'TRF4 - Tribunal Regional Federal 4ª Região' },
  { id: 'trf5', nome: 'TRF5 - Tribunal Regional Federal 5ª Região' },
  { id: 'trf6', nome: 'TRF6 - Tribunal Regional Federal 6ª Região' },
  
  // Tribunais Regionais do Trabalho (24)
  { id: 'trt1', nome: 'TRT1 - Tribunal Regional do Trabalho 1ª Região (RJ)' },
  { id: 'trt2', nome: 'TRT2 - Tribunal Regional do Trabalho 2ª Região (SP)' },
  { id: 'trt3', nome: 'TRT3 - Tribunal Regional do Trabalho 3ª Região (MG)' },
  { id: 'trt4', nome: 'TRT4 - Tribunal Regional do Trabalho 4ª Região (RS)' },
  { id: 'trt5', nome: 'TRT5 - Tribunal Regional do Trabalho 5ª Região (BA)' },
  { id: 'trt6', nome: 'TRT6 - Tribunal Regional do Trabalho 6ª Região (PE)' },
  { id: 'trt7', nome: 'TRT7 - Tribunal Regional do Trabalho 7ª Região (CE)' },
  { id: 'trt8', nome: 'TRT8 - Tribunal Regional do Trabalho 8ª Região (PA/AP)' },
  { id: 'trt9', nome: 'TRT9 - Tribunal Regional do Trabalho 9ª Região (PR)' },
  { id: 'trt10', nome: 'TRT10 - Tribunal Regional do Trabalho 10ª Região (DF/TO)' },
  { id: 'trt11', nome: 'TRT11 - Tribunal Regional do Trabalho 11ª Região (AM/RR)' },
  { id: 'trt12', nome: 'TRT12 - Tribunal Regional do Trabalho 12ª Região (SC)' },
  { id: 'trt13', nome: 'TRT13 - Tribunal Regional do Trabalho 13ª Região (PB)' },
  { id: 'trt14', nome: 'TRT14 - Tribunal Regional do Trabalho 14ª Região (RO/AC)' },
  { id: 'trt15', nome: 'TRT15 - Tribunal Regional do Trabalho 15ª Região (Campinas-SP)' },
  { id: 'trt16', nome: 'TRT16 - Tribunal Regional do Trabalho 16ª Região (MA)' },
  { id: 'trt17', nome: 'TRT17 - Tribunal Regional do Trabalho 17ª Região (ES)' },
  { id: 'trt18', nome: 'TRT18 - Tribunal Regional do Trabalho 18ª Região (GO)' },
  { id: 'trt19', nome: 'TRT19 - Tribunal Regional do Trabalho 19ª Região (AL)' },
  { id: 'trt20', nome: 'TRT20 - Tribunal Regional do Trabalho 20ª Região (SE)' },
  { id: 'trt21', nome: 'TRT21 - Tribunal Regional do Trabalho 21ª Região (RN)' },
  { id: 'trt22', nome: 'TRT22 - Tribunal Regional do Trabalho 22ª Região (PI)' },
  { id: 'trt23', nome: 'TRT23 - Tribunal Regional do Trabalho 23ª Região (MT)' },
  { id: 'trt24', nome: 'TRT24 - Tribunal Regional do Trabalho 24ª Região (MS)' },
  
  // Tribunais Regionais Eleitorais (27)
  { id: 'tre-ac', nome: 'TRE-AC - Tribunal Regional Eleitoral do Acre' },
  { id: 'tre-al', nome: 'TRE-AL - Tribunal Regional Eleitoral de Alagoas' },
  { id: 'tre-ap', nome: 'TRE-AP - Tribunal Regional Eleitoral do Amapá' },
  { id: 'tre-am', nome: 'TRE-AM - Tribunal Regional Eleitoral do Amazonas' },
  { id: 'tre-ba', nome: 'TRE-BA - Tribunal Regional Eleitoral da Bahia' },
  { id: 'tre-ce', nome: 'TRE-CE - Tribunal Regional Eleitoral do Ceará' },
  { id: 'tre-dft', nome: 'TRE-DFT - Tribunal Regional Eleitoral do Distrito Federal' },
  { id: 'tre-es', nome: 'TRE-ES - Tribunal Regional Eleitoral do Espírito Santo' },
  { id: 'tre-go', nome: 'TRE-GO - Tribunal Regional Eleitoral de Goiás' },
  { id: 'tre-ma', nome: 'TRE-MA - Tribunal Regional Eleitoral do Maranhão' },
  { id: 'tre-mt', nome: 'TRE-MT - Tribunal Regional Eleitoral de Mato Grosso' },
  { id: 'tre-ms', nome: 'TRE-MS - Tribunal Regional Eleitoral de Mato Grosso do Sul' },
  { id: 'tre-mg', nome: 'TRE-MG - Tribunal Regional Eleitoral de Minas Gerais' },
  { id: 'tre-pa', nome: 'TRE-PA - Tribunal Regional Eleitoral do Pará' },
  { id: 'tre-pb', nome: 'TRE-PB - Tribunal Regional Eleitoral da Paraíba' },
  { id: 'tre-pr', nome: 'TRE-PR - Tribunal Regional Eleitoral do Paraná' },
  { id: 'tre-pe', nome: 'TRE-PE - Tribunal Regional Eleitoral de Pernambuco' },
  { id: 'tre-pi', nome: 'TRE-PI - Tribunal Regional Eleitoral do Piauí' },
  { id: 'tre-rj', nome: 'TRE-RJ - Tribunal Regional Eleitoral do Rio de Janeiro' },
  { id: 'tre-rn', nome: 'TRE-RN - Tribunal Regional Eleitoral do Rio Grande do Norte' },
  { id: 'tre-rs', nome: 'TRE-RS - Tribunal Regional Eleitoral do Rio Grande do Sul' },
  { id: 'tre-ro', nome: 'TRE-RO - Tribunal Regional Eleitoral de Rondônia' },
  { id: 'tre-rr', nome: 'TRE-RR - Tribunal Regional Eleitoral de Roraima' },
  { id: 'tre-sc', nome: 'TRE-SC - Tribunal Regional Eleitoral de Santa Catarina' },
  { id: 'tre-se', nome: 'TRE-SE - Tribunal Regional Eleitoral de Sergipe' },
  { id: 'tre-sp', nome: 'TRE-SP - Tribunal Regional Eleitoral de São Paulo' },
  { id: 'tre-to', nome: 'TRE-TO - Tribunal Regional Eleitoral do Tocantins' },
  
  // Tribunais de Justiça Militar Estaduais (3)
  { id: 'tjmmg', nome: 'TJM-MG - Tribunal de Justiça Militar de Minas Gerais' },
  { id: 'tjmrs', nome: 'TJM-RS - Tribunal de Justiça Militar do Rio Grande do Sul' },
  { id: 'tjmsp', nome: 'TJM-SP - Tribunal de Justiça Militar de São Paulo' },
  
  // Tribunais de Justiça Estaduais (27)
  { id: 'tjac', nome: 'TJAC - Tribunal de Justiça do Acre' },
  { id: 'tjal', nome: 'TJAL - Tribunal de Justiça de Alagoas' },
  { id: 'tjap', nome: 'TJAP - Tribunal de Justiça do Amapá' },
  { id: 'tjam', nome: 'TJAM - Tribunal de Justiça do Amazonas' },
  { id: 'tjba', nome: 'TJBA - Tribunal de Justiça da Bahia' },
  { id: 'tjce', nome: 'TJCE - Tribunal de Justiça do Ceará' },
  { id: 'tjdft', nome: 'TJDFT - Tribunal de Justiça do Distrito Federal' },
  { id: 'tjes', nome: 'TJES - Tribunal de Justiça do Espírito Santo' },
  { id: 'tjgo', nome: 'TJGO - Tribunal de Justiça de Goiás' },
  { id: 'tjma', nome: 'TJMA - Tribunal de Justiça do Maranhão' },
  { id: 'tjmt', nome: 'TJMT - Tribunal de Justiça de Mato Grosso' },
  { id: 'tjms', nome: 'TJMS - Tribunal de Justiça de Mato Grosso do Sul' },
  { id: 'tjmg', nome: 'TJMG - Tribunal de Justiça de Minas Gerais' },
  { id: 'tjpa', nome: 'TJPA - Tribunal de Justiça do Pará' },
  { id: 'tjpb', nome: 'TJPB - Tribunal de Justiça da Paraíba' },
  { id: 'tjpr', nome: 'TJPR - Tribunal de Justiça do Paraná' },
  { id: 'tjpe', nome: 'TJPE - Tribunal de Justiça de Pernambuco' },
  { id: 'tjpi', nome: 'TJPI - Tribunal de Justiça do Piauí' },
  { id: 'tjrj', nome: 'TJRJ - Tribunal de Justiça do Rio de Janeiro' },
  { id: 'tjrn', nome: 'TJRN - Tribunal de Justiça do Rio Grande do Norte' },
  { id: 'tjrs', nome: 'TJRS - Tribunal de Justiça do Rio Grande do Sul' },
  { id: 'tjro', nome: 'TJRO - Tribunal de Justiça de Rondônia' },
  { id: 'tjrr', nome: 'TJRR - Tribunal de Justiça de Roraima' },
  { id: 'tjsc', nome: 'TJSC - Tribunal de Justiça de Santa Catarina' },
  { id: 'tjsp', nome: 'TJSP - Tribunal de Justiça de São Paulo' },
  { id: 'tjse', nome: 'TJSE - Tribunal de Justiça de Sergipe' },
  { id: 'tjto', nome: 'TJTO - Tribunal de Justiça do Tocantins' },
]

// Tipo para dados complementares do Querido Diário
export const DataJudPage = () => {
  const navigate = useNavigate()
  const [conectado, setConectado] = React.useState<boolean>(false)
  const [testando, setTestando] = React.useState<boolean>(false)
  const [buscando, setBuscando] = React.useState<boolean>(false)
  const [configurado, setConfigurado] = React.useState<boolean>(true) // API pública, sempre configurada
  const [tipoBusca, setTipoBusca] = React.useState<TipoBusca>('numero')
  const [tribunal, setTribunal] = React.useState<string>('trf1')
  const [resultados, setResultados] = React.useState<ProcessoDataJud[]>([])
  const [totalEncontrado, setTotalEncontrado] = React.useState<number>(0)

  // Campos de busca
  const [numeroProcesso, setNumeroProcesso] = React.useState<string>('')
  const [nomeParte, setNomeParte] = React.useState<string>('')
  const [cpfCnpj, setCpfCnpj] = React.useState<string>('')
  const [classe, setClasse] = React.useState<string>('')
  const [buscarMultiTribunal, setBuscarMultiTribunal] = React.useState<boolean>(true)

  // Tribunal detectado automaticamente
  const tribunalDetectado = React.useMemo(() => {
    if (tipoBusca === 'numero' && numeroProcesso.length >= 18) {
      return detectarTribunalPorNumero(numeroProcesso)
    }
    return { tribunal: null, nomeCompleto: null, segmento: null }
  }, [numeroProcesso, tipoBusca])
  const [orgao, setOrgao] = React.useState<string>('')
  const [dataInicio, setDataInicio] = React.useState<string>('')
  const [dataFim, setDataFim] = React.useState<string>('')

  // Testar conexão ao carregar a página
  React.useEffect(() => {
    handleTestarConexao()
  }, [])

  const handleDebugAuth = async () => {
    console.log('🔍 [DataJud] Verificando estado de autenticação...')
    const authState = await debugAuthState()
    console.log('📋 [DataJud] Estado da autenticação:', authState)
    
    if (authState.hasSession) {
      toast.success(`✅ Sessão ativa: ${authState.user?.email}\nToken expira: ${authState.expiresAt}`)
    } else {
      toast.error(`❌ ${authState.error || 'Sem sessão ativa'}`)
    }
  }

  const handleTestarConexao = async () => {
    setTestando(true)
    try {
      console.log('🧪 [DataJud] Testando conexão direta...')
      const resultado = await testarConexao()
      console.log('📋 [DataJud] Resultado do teste:', resultado)
      setConectado(resultado.sucesso)
      if (resultado.sucesso) {
        toast.success(resultado.mensagem)
      } else {
        toast.error(resultado.mensagem)
      }
    } catch (error) {
      console.error('❌ [DataJud] Erro:', error)
      toast.error('Erro ao testar conexão')
      setConectado(false)
    } finally {
      setTestando(false)
    }
  }

  const handleBuscar = async () => {
    setBuscando(true)
    
    try {
      let resultado
      let processos: ProcessoDataJud[] = []
      let total = 0

      switch (tipoBusca) {
        case 'numero':
          if (!numeroProcesso.trim()) {
            toast.error('Digite o número do processo')
            setBuscando(false)
            return
          }

          // Busca automática detectando o tribunal
          toast.info('Detectando tribunal automaticamente...')
          const buscaAuto = await buscarProcessoAutomatico(numeroProcesso)

          if (buscaAuto.sucesso && buscaAuto.processo) {
            setResultados([buscaAuto.processo])
            setTotalEncontrado(1)
            setTribunal(buscaAuto.tribunal!)
            toast.success(`Processo encontrado no ${buscaAuto.tribunal?.toUpperCase()}`)
            
            setBuscando(false)
            return
          } else {
            toast.error(buscaAuto.erro || 'Processo não encontrado')
            setBuscando(false)
            return
          }

        case 'cpf':
          if (!cpfCnpj.trim()) {
            toast.error('Digite o CPF ou CNPJ')
            setBuscando(false)
            return
          }
          
          const cpfLimpo = cpfCnpj.replace(/\D/g, '')
          if (cpfLimpo.length < 11) {
            toast.error('CPF deve ter 11 dígitos, CNPJ deve ter 14 dígitos')
            setBuscando(false)
            return
          }

          if (buscarMultiTribunal) {
            // Busca em múltiplos tribunais
            toast.info('Buscando em múltiplos tribunais... Isso pode levar alguns segundos.')
            const resultadoMulti = await buscarProcessosPorCpfMultiTribunal(cpfLimpo)
            processos = resultadoMulti.processos
            total = resultadoMulti.total
            
            if (resultadoMulti.tribunaisConsultados.length > 0) {
              toast.success(
                `Encontrados ${total} processos em ${resultadoMulti.tribunaisConsultados.length} tribunais: ${resultadoMulti.tribunaisConsultados.map(t => t.toUpperCase()).join(', ')}`
              )
            }
            if (resultadoMulti.erros.length > 0) {
              console.warn('Erros em alguns tribunais:', resultadoMulti.erros)
            }
          } else {
            // Busca em tribunal específico
            toast.info(`Buscando no ${tribunal.toUpperCase()}...`)
            const resultadoCpf = await buscarProcessosPorCpfCnpj(cpfLimpo, tribunal)
            processos = resultadoCpf.processos
            total = resultadoCpf.total
            
            if (total > 0) {
              toast.success(`Encontrados ${total} processos no ${tribunal.toUpperCase()}`)
            }
          }
          
          setResultados(processos)
          setTotalEncontrado(total)
          
          if (total === 0) {
            toast.info('Nenhum processo encontrado para este CPF/CNPJ')
          }
          
          // Registrar consulta
          registrarConsulta({
            numero_processo: `CPF/CNPJ: ${cpfLimpo}`,
            tribunal: buscarMultiTribunal ? 'Múltiplos' : tribunal,
            tipo_busca: 'cpf',
            sucesso: total > 0
          }).catch(console.error)
          
          setBuscando(false)
          return

        case 'parte':
          if (!nomeParte.trim()) {
            toast.error('Digite o nome da parte')
            setBuscando(false)
            return
          }
          resultado = await buscarProcessosPorParte(nomeParte, tribunal, 20)
          break

        case 'classe':
          if (!classe.trim()) {
            toast.error('Digite a classe processual')
            return
          }
          resultado = await buscarProcessosPorClasse(classe, tribunal, 20)
          break

        case 'avancada':
          // Construir query string para busca avançada
          const queryParts: string[] = []
          if (numeroProcesso) queryParts.push(`numeroProcesso:${numeroProcesso}`)
          if (nomeParte) queryParts.push(`parte:${nomeParte}`)
          if (classe) queryParts.push(`classe:${classe}`)
          if (orgao) queryParts.push(`orgao:${orgao}`)
          if (dataInicio) queryParts.push(`dataInicio:${dataInicio}`)
          if (dataFim) queryParts.push(`dataFim:${dataFim}`)
          
          const queryString = queryParts.join(' AND ') || '*'
          resultado = await buscaAvancada(queryString, tribunal, 50)
          break
      }

      if (resultado) {
        processos = resultado.hits?.hits?.map((hit: any) => hit._source) || resultado.processos || []
        total = resultado.hits?.total?.value || resultado.total || 0
      }
      
      setResultados(processos)
      setTotalEncontrado(total)

      // Registrar consulta no histórico
      if (processos.length > 0 && processos[0].numeroProcesso) {
        registrarConsulta({
          numero_processo: processos[0].numeroProcesso,
          tribunal: tribunal || 'Detectado automaticamente',
          tipo_busca: tipoBusca,
          sucesso: true
        }).catch(console.error)
      }

      if (processos.length === 0) {
        toast.info('Nenhum processo encontrado')
      } else {
        toast.success(`${processos.length} processo(s) encontrado(s)`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar processos')
      setResultados([])
      setTotalEncontrado(0)
    } finally {
      setBuscando(false)
    }
  }

  const limparBusca = () => {
    setNumeroProcesso('')
    setNomeParte('')
    setCpfCnpj('')
    setClasse('')
    setOrgao('')
    setDataInicio('')
    setDataFim('')
    setResultados([])
    setTotalEncontrado(0)
  }

  // Formatar CPF/CNPJ enquanto digita
  const formatarCpfCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 11) {
      // CPF: 000.000.000-00
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18)
    }
  }

  const renderValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return value.nome || value.codigo || JSON.stringify(value)
    }
    return String(value || '-')
  }

  const obterMarcaDagua = (() => {
    let cache: { dataUrl: string; width: number; height: number } | null = null
    const watermarkUrl =
      'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png'

    return async () => {
      if (cache) return cache
      const response = await fetch(watermarkUrl)
      if (!response.ok) {
        throw new Error('Nao foi possivel carregar a marca dagua.')
      }
      const blob = await response.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Falha ao ler a marca dagua.'))
        reader.readAsDataURL(blob)
      })
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('Falha ao medir a marca dagua.'))
        img.src = dataUrl
      })
      cache = { dataUrl, ...dimensions }
      return cache
    }
  })()

  const exportarProcessoParaPDF = async (processo: ProcessoDataJud) => {
    try {
      const doc = new jsPDF()
      const info = extrairInfoProcesso(processo)
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 18
      const topMargin = 28
      const bottomMargin = 18
      let y = topMargin
      const maxWidth = pageWidth - 2 * margin
      const watermark = await obterMarcaDagua().catch(() => null)

      // Configurações de fonte
      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - bottomMargin) {
          doc.addPage()
          y = topMargin
        }
      }

      const addText = (text: string, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        const lines = doc.splitTextToSize(text, maxWidth)
        const lineHeight = fontSize * 0.5 + 3
        ensureSpace(lines.length * lineHeight + 2)
        doc.text(lines, margin, y)
        y += lines.length * lineHeight
      }

      const addSectionTitle = (title: string) => {
        ensureSpace(14)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(26, 47, 76)
        doc.text(title, margin, y)
        y += 6
        doc.setDrawColor(220)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
        doc.setTextColor(40)
      }

      const addKeyValue = (label: string, value: string) => {
        addText(`${label}: ${value}`, 10)
      }

      // Título
      addText('RELATORIO COMPLETO DO PROCESSO', 16, true)
      y += 5
      addText(`Processo: ${formatarNumeroProcesso(info.numero)}`, 12, true)
      y += 3

      if (watermark) {
        const targetWidth = pageWidth * 0.28
        const aspect = watermark.height / watermark.width
        const targetHeight = targetWidth * aspect
        const x = pageWidth - targetWidth - margin
        const yPos = topMargin + 2
        const jsPdfAny = jsPDF as unknown as { GState?: new (state: { opacity: number }) => any }
        const docAny = doc as unknown as { setGState?: (state: any) => void }

        if (docAny.setGState && jsPdfAny.GState) {
          docAny.setGState(new jsPdfAny.GState({ opacity: 0.15 }))
        }
        doc.addImage(watermark.dataUrl, 'PNG', x, yPos, targetWidth, targetHeight)
        if (docAny.setGState && jsPdfAny.GState) {
          docAny.setGState(new jsPdfAny.GState({ opacity: 1 }))
        }
      }

      // Informações básicas
      addSectionTitle('DADOS GERAIS')
      addKeyValue('Tribunal', info.tribunal)
      addKeyValue('Classe', renderValue(info.classe))
      addKeyValue('Grau', processo.grau || '-')
      addKeyValue('Sistema', renderValue(processo.sistema))
      addKeyValue('Formato', renderValue(processo.formato))
      addKeyValue('Nivel de Sigilo', processo.nivelSigilo === 0 ? 'Publico' : 'Restrito')
      if (processo.id) addKeyValue('ID do Processo', processo.id)
      y += 5

      // Órgão Julgador
      if (processo.orgaoJulgador) {
        addSectionTitle('ORGAO JULGADOR')
        addKeyValue('Nome', renderValue(processo.orgaoJulgador))
        if (processo.orgaoJulgador.codigoMunicipioIBGE) {
          addKeyValue('Codigo IBGE', processo.orgaoJulgador.codigoMunicipioIBGE)
        }
        y += 5
      }

      // Datas
      addSectionTitle('DATAS')
      addKeyValue('Data de Ajuizamento', info.dataAjuizamento)
      if (processo.dataHoraUltimaAtualizacao) {
        addKeyValue(
          'Ultima Atualizacao',
          new Date(processo.dataHoraUltimaAtualizacao).toLocaleString('pt-BR'),
        )
      }
      y += 5

      // Assuntos
      if (processo.assuntos && processo.assuntos.length > 0) {
        addSectionTitle('ASSUNTOS')
        processo.assuntos.forEach((assunto: any) => {
          const txt = `- ${renderValue(assunto)}`
          if (assunto.codigo) {
            addText(`${txt} (Codigo: ${assunto.codigo})`)
          } else {
            addText(txt)
          }
        })
        y += 5
      }

      // Movimentações
      if (processo.movimentos && processo.movimentos.length > 0) {
        addSectionTitle('HISTORICO DE MOVIMENTACOES')
        addText(`Total: ${processo.movimentos.length} movimentacoes`, 10, true)
        y += 3

        processo.movimentos.forEach((mov: any, index: number) => {
          ensureSpace(22)

          addText(`${index + 1}. ${mov.nome}`, 11, true)
          
          if (mov.codigo || mov.codigoNacional) {
            let codigos = []
            if (mov.codigo) codigos.push(`Codigo: ${mov.codigo}`)
            if (mov.codigoNacional) codigos.push(`Cod. Nacional: ${mov.codigoNacional}`)
            addText(codigos.join(' | '), 9)
          }

          if (mov.dataHora) {
            const data = new Date(mov.dataHora)
            addText(`Data/Hora: ${data.toLocaleDateString('pt-BR')} as ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 9)
          }

          if (mov.complemento) {
            addText(`Complemento: ${mov.complemento}`, 9)
          }

          if (mov.complementosTabelados && mov.complementosTabelados.length > 0) {
            addText('Detalhes:', 9, true)
            mov.complementosTabelados.forEach((c: any) => {
              addText(`  - ${c.nome}`, 9)
              if (c.descricao) {
                addText(`    ${c.descricao.replace(/_/g, ' ')}`, 8)
              }
              if (c.codigo || c.valor) {
                let detalhes = []
                if (c.codigo) detalhes.push(`Cod: ${c.codigo}`)
                if (c.valor) detalhes.push(`Val: ${c.valor}`)
                addText(`    ${detalhes.join(' | ')}`, 8)
              }
            })
          }
          
          y += 5
        })
      }

      // Marca d'agua e rodapé
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(245, 247, 251)
        doc.rect(0, 0, pageWidth, 22, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(26, 47, 76)
        doc.text('Relatorio DataJud', margin, 14)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(90)
        doc.text(
          formatarNumeroProcesso(info.numero),
          pageWidth - margin,
          14,
          { align: 'right' },
        )
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Gerado em: ${new Date().toLocaleString('pt-BR')} - Pagina ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
        doc.setFontSize(7)
        doc.setTextColor(120)
        doc.text(
          'LGPD: Este relatorio contem dados pessoais e deve ser acessado e compartilhado apenas por pessoas autorizadas.',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        )
        doc.setTextColor(40)
      }

      // Salvar PDF
      const nomeArquivo = `processo_${formatarNumeroProcesso(info.numero).replace(/[^0-9]/g, '')}.pdf`
      doc.save(nomeArquivo)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const renderPolos = (processo: ProcessoDataJud) => {
    const polos = processo.dadosBasicos?.polo || []
    if (!polos.length) return null
    
    // Separar por tipo de polo
    const poloAtivo = polos.filter((p: any) => p.polo === 'AT' || p.polo?.toLowerCase().includes('ativo') || p.polo?.toLowerCase().includes('autor') || p.polo?.toLowerCase().includes('requerente'))
    const poloPassivo = polos.filter((p: any) => p.polo === 'PA' || p.polo?.toLowerCase().includes('passivo') || p.polo?.toLowerCase().includes('réu') || p.polo?.toLowerCase().includes('requerido'))
    const outrosPolos = polos.filter((p: any) => !poloAtivo.includes(p) && !poloPassivo.includes(p))
    
    const renderPolo = (polo: any, idx: number) => (
      <div key={idx} className="rounded-xl border border-border bg-surface-2 p-3 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">
              {polo.nome || '-'}
            </p>
            {polo.tipoPessoa && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {polo.tipoPessoa === 'fisica' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}
              </p>
            )}
            {polo.documento && (
              <p className="text-[10px] text-text-muted font-mono">
                Doc: {polo.documento}
              </p>
            )}
          </div>
          <Badge variant={polo.polo === 'AT' ? 'info' : polo.polo === 'PA' ? 'warning' : 'default'} className="text-[10px]">
            {polo.polo || polo.tipo || 'Parte'}
          </Badge>
        </div>
        
        {/* Advogados da parte */}
        {polo.advogados && polo.advogados.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[10px] text-text-muted mb-1">Advogado(s):</p>
            {polo.advogados.map((adv: any, advIdx: number) => (
              <div key={advIdx} className="text-xs text-text flex items-center gap-1">
                <span>⚖️</span>
                <span className="font-medium">{adv.nome}</span>
                {adv.inscricao && <span className="text-text-muted font-mono">OAB {adv.inscricao}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <p className="text-text font-semibold text-base">Partes do Processo</p>
          <Badge variant="info" className="ml-auto">{polos.length} parte(s)</Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Polo Ativo */}
          {poloAtivo.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-info flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info"></span>
                Polo Ativo (Autor/Requerente)
              </p>
              <div className="space-y-2">
                {poloAtivo.map((polo: any, idx: number) => renderPolo(polo, idx))}
              </div>
            </div>
          )}
          
          {/* Polo Passivo */}
          {poloPassivo.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-warning flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning"></span>
                Polo Passivo (Réu/Requerido)
              </p>
              <div className="space-y-2">
                {poloPassivo.map((polo: any, idx: number) => renderPolo(polo, idx))}
              </div>
            </div>
          )}
        </div>
        
        {/* Outros (terceiros, etc) */}
        {outrosPolos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Terceiros / Outros
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {outrosPolos.map((polo: any, idx: number) => renderPolo(polo, idx))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-12 px-6 lg:px-8',
        'bg-base text-text',
      )}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="space-y-5 max-w-6xl mx-auto">
        <header
          className={cn(
            'relative overflow-hidden rounded-3xl border p-6 shadow-[0_28px_60px_-48px_rgba(15,23,42,0.35)]',
            'border-border bg-gradient-to-br from-brand-primary-subtle via-surface to-surface-alt',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-no-repeat bg-right bg-[length:520px]',
              'opacity-90',
            )}
            style={{ backgroundImage: `url(${heroLight})` }}
          />
          <div className="relative z-10 space-y-2">
            <p
              className={cn(
                'text-[11px] uppercase tracking-[0.32em]',
                'text-text-muted',
              )}
            >
              Integracao CNJ
            </p>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#721011]" />
              <h2 className={cn('font-display text-2xl', 'text-text')}>
                API DataJud
              </h2>
            </div>
            <p className={cn('text-sm', 'text-text-muted')}>
              Base Nacional de Dados do Poder Judiciario - Consulta de processos judiciais
            </p>
          </div>
        </header>

      {/* Status da Conexão */}
      <Card className="border border-border bg-surface/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Status da Conexão</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDebugAuth}
                title="Debug: Verificar estado da autenticação"
              >
                <Bug className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestarConexao}
                disabled={testando}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', testando && 'animate-spin')} />
                Testar Conexão
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!configurado ? (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-warning">
                  API DataJud não configurada
                </p>
                <p className="text-xs text-text-muted">
                  Configure a variável <code className="px-1.5 py-0.5 bg-black/5 rounded">VITE_DATAJUD_API_KEY</code> no arquivo .env.
                  Solicite sua chave em:{' '}
                  <a
                    href="https://www.cnj.jus.br/sistemas/datajud/api-publica/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    CNJ - API Pública
                  </a>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/app/config')}
                >
                  Ir para Configurações
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              'flex items-center gap-3 rounded-2xl border p-4',
              conectado
                ? 'border-success/30 bg-success/5'
                : 'border-error/30 bg-error/5'
            )}>
              <div className={cn(
                'h-3 w-3 rounded-full',
                conectado ? 'bg-success animate-pulse' : 'bg-error'
              )} />
              <div>
                <p className="text-sm font-medium">
                  {conectado ? 'Conectado à API DataJud' : 'Falha na conexão'}
                </p>
                <p className="text-xs text-text-muted">
                  {conectado
                    ? 'Pronto para consultar processos judiciais'
                    : 'Verifique suas credenciais ou tente novamente'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipo de Busca */}
      <Card className="border border-border bg-surface/90">
        <CardHeader>
          <CardTitle className="text-sm">Tipo de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'numero' as TipoBusca, label: 'Por Número', icon: FileText, desc: 'Busca por número CNJ' },
              { id: 'cpf' as TipoBusca, label: 'Por CPF/CNPJ', icon: Users, desc: 'Busca por documento da parte' },
              { id: 'parte' as TipoBusca, label: 'Por Nome', icon: Users, desc: 'Busca por nome da parte' },
              { id: 'classe' as TipoBusca, label: 'Por Classe', icon: Calendar, desc: 'Busca por classe processual' },
              { id: 'avancada' as TipoBusca, label: 'Avançada', icon: Search, desc: 'Busca com múltiplos filtros' },
            ].map((tipo) => {
              const Icon = tipo.icon
              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => {
                    setTipoBusca(tipo.id)
                    limparBusca()
                  }}
                  title={tipo.desc}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                    tipoBusca === tipo.id
                      ? 'border-[#721011]/60 bg-[#721011]/10 text-[#721011]'
                      : 'border-border bg-white text-text-muted hover:text-text'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tipo.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tribunal - Só mostra para busca por parte, classe ou avançada (ou CPF sem multi-tribunal) */}
      {(tipoBusca !== 'numero' && !(tipoBusca === 'cpf' && buscarMultiTribunal)) && (
        <Card className="border border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-sm">Tribunal</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={tribunal}
              onChange={(e) => setTribunal(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {tribunais.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Busca */}
      <Card className="border border-border bg-surface/90">
        <CardHeader>
          <CardTitle className="text-sm">
            {tipoBusca === 'numero' && 'Buscar por Número do Processo'}
            {tipoBusca === 'parte' && 'Buscar por Nome da Parte'}
            {tipoBusca === 'cpf' && 'Buscar por CPF/CNPJ'}
            {tipoBusca === 'classe' && 'Buscar por Classe Processual'}
            {tipoBusca === 'avancada' && 'Busca Avançada'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo CPF/CNPJ */}
          {tipoBusca === 'cpf' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  CPF ou CNPJ da Parte
                </label>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatarCpfCnpj(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  maxLength={18}
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Digite o CPF (11 dígitos) ou CNPJ (14 dígitos) para buscar processos onde a pessoa/empresa é parte
                </p>
              </div>
              
              {/* Opção de busca multi-tribunal */}
              <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buscarMultiTribunal}
                    onChange={(e) => setBuscarMultiTribunal(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-text">
                      🔍 Buscar em múltiplos tribunais
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {buscarMultiTribunal 
                        ? 'Buscará em TJSP, TJRJ, TJMG, TJRS, TJPR, TJSC e TJBA (pode levar mais tempo)'
                        : 'Buscará apenas no tribunal selecionado acima'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {(tipoBusca === 'numero' || tipoBusca === 'avancada') && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                Número do Processo
              </label>
              <Input
                placeholder="0000000-00.0000.0.00.0000"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              {/* Mostrar tribunal detectado automaticamente */}
              {tipoBusca === 'numero' && numeroProcesso.length >= 18 && (
                <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  {tribunalDetectado.tribunal ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">🎯</span>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Tribunal detectado automaticamente</p>
                        <p className="text-sm font-semibold text-primary">
                          {tribunalDetectado.nomeCompleto}
                        </p>
                        {tribunalDetectado.segmento && (
                          <p className="text-[10px] text-text-muted">{tribunalDetectado.segmento}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-xs">
                        Não foi possível detectar o tribunal. Verifique o formato do número.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(tipoBusca === 'parte' || tipoBusca === 'avancada') && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                Nome da Parte
              </label>
              <Input
                placeholder="Digite o nome completo ou parcial"
                value={nomeParte}
                onChange={(e) => setNomeParte(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
          )}

          {(tipoBusca === 'classe' || tipoBusca === 'avancada') && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">
                Classe Processual
              </label>
              <Input
                placeholder="Ex: Ação Civil Pública"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
          )}

          {tipoBusca === 'avancada' && (
            <>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  Órgão Julgador
                </label>
                <Input
                  placeholder="Ex: 1ª Vara Federal"
                  value={orgao}
                  onChange={(e) => setOrgao(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleBuscar}
              disabled={buscando || !configurado || !conectado}
              className="flex-1"
            >
              <Search className={cn('h-4 w-4 mr-2', buscando && 'animate-pulse')} />
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant="outline" onClick={limparBusca}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {totalEncontrado > 0 && (
        <Card className="border border-border bg-surface/90">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Resultados da Busca
              <Badge variant="info" className="ml-2">
                {totalEncontrado} encontrado(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {resultados.map((processo, index) => {
              // Debug: ver estrutura do processo
              if (index === 0) {
                console.log('🔍 Estrutura completa do processo:', JSON.stringify(processo, null, 2))
              }
              
              const info = extrairInfoProcesso(processo)
              
              // Formatar data de ajuizamento
              const formatarData = (data: string | undefined) => {
                if (!data) return '-'
                // Formato YYYYMMDDHHMMSS ou ISO
                if (data.length === 14) {
                  const ano = data.slice(0, 4)
                  const mes = data.slice(4, 6)
                  const dia = data.slice(6, 8)
                  const hora = data.slice(8, 10)
                  const min = data.slice(10, 12)
                  return `${dia}/${mes}/${ano} ${hora}:${min}`
                }
                try {
                  return new Date(data).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                } catch {
                  return data
                }
              }
              
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-soft hover:shadow-md transition-shadow"
                >
                  <div className="space-y-6">
                    {/* ===== CABEÇALHO / CAPA PROCESSUAL ===== */}
                    <div className="pb-4 border-b border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          {/* Número do Processo */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-text-muted">Número Único CNJ</p>
                              <p className="font-mono text-lg font-bold text-primary">
                                {formatarNumeroProcesso(info.numero)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Badges de classificação */}
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="info" className="text-xs font-semibold">
                              {info.tribunal || processo.tribunal || 'Tribunal não informado'}
                            </Badge>
                            <Badge className="text-xs">{renderValue(info.classe)}</Badge>
                            {processo.grau && (
                              <Badge variant="default" className="text-xs">
                                {processo.grau === 'G1' ? '1º Grau' : processo.grau === 'G2' ? '2º Grau' : processo.grau === 'SUP' ? 'Superior' : processo.grau}
                              </Badge>
                            )}
                            {processo.sistema && (
                              <Badge variant="default" className="text-xs">
                                📱 {renderValue(processo.sistema)}
                              </Badge>
                            )}
                            {processo.formato && (
                              <Badge variant="default" className="text-xs">
                                {renderValue(processo.formato) === 'Eletrônico' ? '💻' : '📄'} {renderValue(processo.formato)}
                              </Badge>
                            )}
                            {processo.nivelSigilo !== undefined && (
                              <Badge variant={processo.nivelSigilo === 0 ? "success" : "warning"} className="text-xs">
                                {processo.nivelSigilo === 0 ? "🔓 Público" : `🔒 Sigilo ${processo.nivelSigilo}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Botão Favorito */}
                        <BotaoFavorito processo={processo} />
                      </div>
                    </div>

                    {/* ===== INFORMAÇÕES DA CAPA ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Órgão Julgador */}
                      <div className="p-3 rounded-xl bg-surface-2 border border-border">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Órgão Julgador</p>
                        <p className="text-text font-semibold text-sm">{renderValue(info.orgaoJulgador) || '-'}</p>
                        {processo.orgaoJulgador?.codigo && (
                          <p className="text-text-muted text-[10px] mt-1 font-mono">
                            Código: {processo.orgaoJulgador.codigo}
                          </p>
                        )}
                        {processo.orgaoJulgador?.codigoMunicipioIBGE && (
                          <p className="text-text-muted text-[10px] font-mono">
                            Município IBGE: {processo.orgaoJulgador.codigoMunicipioIBGE}
                          </p>
                        )}
                      </div>
                      
                      {/* Data de Ajuizamento */}
                      <div className="p-3 rounded-xl bg-surface-2 border border-border">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">📅 Data de Ajuizamento</p>
                        <p className="text-text font-semibold text-sm">
                          {formatarData(processo.dataAjuizamento || processo.dadosBasicos?.dataAjuizamento)}
                        </p>
                      </div>
                      
                      {/* Última Atualização */}
                      <div className="p-3 rounded-xl bg-surface-2 border border-border">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">🔄 Última Atualização</p>
                        <p className="text-text font-semibold text-sm">
                          {processo.dataHoraUltimaAtualizacao
                            ? new Date(processo.dataHoraUltimaAtualizacao).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </p>
                      </div>
                      
                      {/* Valor da Causa (se disponível) */}
                      <div className="p-3 rounded-xl bg-surface-2 border border-border">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">💰 Valor da Causa</p>
                        <p className="text-text font-semibold text-sm">
                          {processo.dadosBasicos?.valorCausa 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processo.dadosBasicos.valorCausa)
                            : processo.valorCausa
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processo.valorCausa)
                            : 'Não informado'}
                        </p>
                      </div>
                    </div>

                    {/* ===== ASSUNTOS ===== */}
                    {((processo.assuntos && processo.assuntos.length > 0) || (processo.dadosBasicos?.assunto)) && (
                      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📋</span>
                          <p className="text-text font-semibold">Assuntos Processuais</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(processo.assuntos || [processo.dadosBasicos?.assunto]).flat().filter(Boolean).map((assunto: any, idx: number) => (
                            <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border">
                              <span className="text-sm font-medium text-text">
                                {typeof assunto === 'string' ? assunto : assunto?.nome || 'Assunto'}
                              </span>
                              {assunto?.codigo && (
                                <span className="text-[10px] text-text-muted font-mono bg-surface-2 px-1.5 py-0.5 rounded">
                                  #{assunto.codigo}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ===== CLASSE PROCESSUAL DETALHADA ===== */}
                    {processo.classe && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">⚖️</span>
                          <p className="text-text font-semibold">Classe Processual</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium text-text">
                            {processo.classe?.nome || renderValue(processo.classe)}
                          </span>
                          {processo.classe?.codigo && (
                            <Badge variant="default" className="text-xs font-mono">
                              Código: {processo.classe.codigo}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ===== ID E METADADOS TÉCNICOS ===== */}
                    <div className="p-3 rounded-lg bg-surface-2 border border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Metadados Técnicos</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                        {processo.id && (
                          <div>
                            <span className="text-text-muted">ID DataJud:</span>{' '}
                            <span className="text-text">{processo.id}</span>
                          </div>
                        )}
                        {processo['@timestamp'] && (
                          <div>
                            <span className="text-text-muted">Timestamp:</span>{' '}
                            <span className="text-text">{processo['@timestamp']}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ===== PARTES DO PROCESSO ===== */}
                    <div className="pt-4 border-t border-border">
                      {renderPolos(processo)}
                    </div>

                    {/* ===== MOVIMENTAÇÕES PROCESSUAIS ===== */}
                    {processo.movimentos && processo.movimentos.length > 0 && (
                      <details className="pt-4 border-t border-border">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                            <Calendar className="w-5 h-5" />
                            <span className="font-semibold">Histórico de Movimentações</span>
                            <Badge variant="default" className="ml-auto bg-white/20 text-white border-0">
                              {processo.movimentos.length} movimentações
                            </Badge>
                            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        
                        <div className="mt-4 max-h-[600px] overflow-y-auto space-y-3 p-4 border rounded-xl bg-surface-2">
                          {processo.movimentos
                            .filter((m: any) => m.nome)
                            .sort((a: any, b: any) => {
                              const dateA = a.dataHora ? new Date(a.dataHora).getTime() : 0
                              const dateB = b.dataHora ? new Date(b.dataHora).getTime() : 0
                              return dateB - dateA // Mais recente primeiro
                            })
                            .map((mov: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex gap-4 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                              >
                                {/* Timeline indicator */}
                                <div className="flex-shrink-0 flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                    <span className="text-xs font-bold text-primary">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  {idx < (processo.movimentos?.filter((m: any) => m.nome).length || 0) - 1 && (
                                    <div className="w-px flex-1 bg-border mt-2 min-h-[20px]"></div>
                                  )}
                                </div>
                                
                                {/* Conteúdo da movimentação */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-text leading-snug">
                                        {mov.nome}
                                      </p>
                                      {(mov.codigo || mov.codigoNacional) && (
                                        <p className="text-[10px] text-text-muted mt-1 font-mono flex gap-2">
                                          {mov.codigo && <span>Código: {mov.codigo}</span>}
                                          {mov.codigoNacional && <span>• Nacional: {mov.codigoNacional}</span>}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="default" className="text-[10px]">
                                        {mov.dataHora
                                          ? new Date(mov.dataHora).toLocaleDateString('pt-BR', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                            })
                                          : 'Sem data'}
                                      </Badge>
                                      {mov.dataHora && (
                                        <span className="text-[10px] text-text-muted font-mono">
                                          {new Date(mov.dataHora).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Órgão Julgador da movimentação */}
                                  {mov.orgaoJulgador?.nome && (
                                    <p className="text-xs text-text-muted mb-2">
                                      📍 {mov.orgaoJulgador.nome}
                                    </p>
                                  )}
                                  
                                  {/* Complemento em texto */}
                                  {mov.complemento && (
                                    <div className="mb-2 p-2 bg-surface-2 rounded-lg text-xs text-text border-l-3 border-primary/30">
                                      {mov.complemento}
                                    </div>
                                  )}
                                  
                                  {/* Complementos Tabelados Detalhados */}
                                  {mov.complementosTabelados && mov.complementosTabelados.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">
                                        Detalhes da Movimentação:
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {mov.complementosTabelados.map((c: any, cIdx: number) => (
                                          <div key={cIdx} className="text-xs bg-info/5 p-2 rounded-lg border border-info/10">
                                            <p className="text-text font-medium">{c.nome}</p>
                                            {c.descricao && (
                                              <p className="text-text-muted text-[10px] mt-0.5">
                                                {c.descricao.replace(/_/g, ' ')}
                                              </p>
                                            )}
                                            {(c.codigo || c.valor) && (
                                              <p className="text-[10px] text-text-muted font-mono mt-1">
                                                {c.codigo && `Cód: ${c.codigo}`}
                                                {c.codigo && c.valor && ' • '}
                                                {c.valor && `Val: ${c.valor}`}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}

                    {/* ===== AÇÕES ===== */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formatarNumeroProcesso(info.numero))
                          toast.success('Número copiado!')
                        }}
                      >
                        📋 Copiar Número
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(processo, null, 2))
                          toast.success('JSON completo copiado!')
                        }}
                      >
                        📄 Copiar JSON
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => exportarProcessoParaPDF(processo)}
                        className="flex items-center gap-2 bg-brand-secondary text-white hover:bg-brand-secondary-dark border-0"
                      >
                        <FileDown className="h-4 w-4" />
                        Exportar PDF
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('Funcionalidade em desenvolvimento')
                        }}
                      >
                        📥 Importar para Casos
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
