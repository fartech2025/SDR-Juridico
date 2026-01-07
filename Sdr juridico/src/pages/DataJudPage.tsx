import * as React from 'react'
import { Search, RefreshCw, AlertCircle, Database, FileText, Users, Calendar, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

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
  buscaAvancada,
  extrairInfoProcesso,
  buscarProcessoAutomatico,
  formatarNumeroProcesso,
  type ProcessoDataJud,
} from '@/services/datajudService'
import { cn } from '@/utils/cn'

type TipoBusca = 'numero' | 'parte' | 'classe' | 'avancada'

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

export const DataJudPage = () => {
  const navigate = useNavigate()
  const [conectado, setConectado] = React.useState<boolean>(false)
  const [testando, setTestando] = React.useState<boolean>(false)
  const [buscando, setBuscando] = React.useState<boolean>(false)
  const [tipoBusca, setTipoBusca] = React.useState<TipoBusca>('numero')
  const [tribunal, setTribunal] = React.useState<string>('trf1')
  const [resultados, setResultados] = React.useState<ProcessoDataJud[]>([])
  const [totalEncontrado, setTotalEncontrado] = React.useState<number>(0)

  // Campos de busca
  const [numeroProcesso, setNumeroProcesso] = React.useState<string>('')
  const [nomeParte, setNomeParte] = React.useState<string>('')
  const [classe, setClasse] = React.useState<string>('')
  const [orgao, setOrgao] = React.useState<string>('')
  const [dataInicio, setDataInicio] = React.useState<string>('')
  const [dataFim, setDataFim] = React.useState<string>('')

  const configurado = isDataJudConfigured()

  React.useEffect(() => {
    if (configurado) {
      handleTestarConexao()
    }
  }, [])

  const handleTestarConexao = async () => {
    setTestando(true)
    try {
      const resultado = await testarConexao()
      setConectado(resultado.sucesso)
      if (resultado.sucesso) {
        toast.success(resultado.mensagem)
      } else {
        toast.error(resultado.mensagem)
      }
    } catch (error) {
      toast.error('Erro ao testar conexão')
      setConectado(false)
    } finally {
      setTestando(false)
    }
  }

  const handleBuscar = async () => {
    if (!configurado) {
      toast.error('API DataJud não configurada. Configure em .env')
      return
    }

    setBuscando(true)
    try {
      let resultado

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
          resultado = await buscaAvancada(
            {
              numeroProcesso: numeroProcesso || undefined,
              nomeParte: nomeParte || undefined,
              classe: classe || undefined,
              orgao: orgao || undefined,
              dataInicio: dataInicio || undefined,
              dataFim: dataFim || undefined,
            },
            tribunal,
            50
          )
          break
      }

      const processos = resultado.hits.hits.map((hit) => hit._source)
      setResultados(processos)
      setTotalEncontrado(resultado.hits.total.value)

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
    setClasse('')
    setOrgao('')
    setDataInicio('')
    setDataFim('')
    setResultados([])
    setTotalEncontrado(0)
  }

  const renderValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return value.nome || value.codigo || JSON.stringify(value)
    }
    return String(value || '-')
  }

  const exportarProcessoParaPDF = (processo: ProcessoDataJud) => {
    try {
      const doc = new jsPDF()
      const info = extrairInfoProcesso(processo)
      let y = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin

      // Configurações de fonte
      const addText = (text: string, fontSize = 10, isBold = false) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, margin, y)
        y += lines.length * (fontSize * 0.5) + 3
      }

      // Título
      addText('RELATORIO COMPLETO DO PROCESSO', 16, true)
      y += 5
      addText(`Processo: ${formatarNumeroProcesso(info.numero)}`, 12, true)
      y += 3

      // Informações básicas
      addText('DADOS GERAIS', 14, true)
      addText(`Tribunal: ${info.tribunal}`)
      addText(`Classe: ${renderValue(info.classe)}`)
      addText(`Grau: ${processo.grau || '-'}`)
      addText(`Sistema: ${renderValue(processo.sistema)}`)
      addText(`Formato: ${renderValue(processo.formato)}`)
      addText(`Nivel de Sigilo: ${processo.nivelSigilo === 0 ? 'Publico' : 'Restrito'}`)
      if (processo.id) addText(`ID do Processo: ${processo.id}`)
      y += 5

      // Órgão Julgador
      if (processo.orgaoJulgador) {
        addText('ORGAO JULGADOR', 14, true)
        addText(`Nome: ${renderValue(processo.orgaoJulgador)}`)
        if (processo.orgaoJulgador.codigoMunicipioIBGE) {
          addText(`Codigo IBGE: ${processo.orgaoJulgador.codigoMunicipioIBGE}`)
        }
        y += 5
      }

      // Datas
      addText('DATAS', 14, true)
      addText(`Data de Ajuizamento: ${info.dataAjuizamento}`)
      if (processo.dataHoraUltimaAtualizacao) {
        addText(`Ultima Atualizacao: ${new Date(processo.dataHoraUltimaAtualizacao).toLocaleString('pt-BR')}`)
      }
      y += 5

      // Assuntos
      if (processo.assuntos && processo.assuntos.length > 0) {
        addText('ASSUNTOS', 14, true)
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
        addText('HISTORICO DE MOVIMENTACOES', 14, true)
        addText(`Total: ${processo.movimentos.length} movimentacoes`, 10, true)
        y += 3

        processo.movimentos.forEach((mov: any, index: number) => {
          if (y > 250) {
            doc.addPage()
            y = 20
          }

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

      // Rodapé
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Gerado em: ${new Date().toLocaleString('pt-BR')} - Pagina ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
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

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-7 shadow-soft"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.94) 70%, rgba(216,232,255,0.3) 100%), url(${heroLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '560px',
        }}
      >
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <p className="text-[11px] uppercase tracking-[0.32em] text-text-subtle">
              Integração CNJ
            </p>
          </div>
          <h2 className="font-display text-2xl text-text">API DataJud</h2>
          <p className="text-sm text-text-muted">
            Base Nacional de Dados do Poder Judiciário - Consulta de processos judiciais
          </p>
        </div>
      </header>

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Status da Conexão</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestarConexao}
              disabled={testando}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', testando && 'animate-spin')} />
              Testar Conexão
            </Button>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tipo de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'numero' as TipoBusca, label: 'Por Número', icon: FileText },
              { id: 'parte' as TipoBusca, label: 'Por Parte', icon: Users },
              { id: 'classe' as TipoBusca, label: 'Por Classe', icon: Calendar },
              { id: 'avancada' as TipoBusca, label: 'Busca Avançada', icon: Search },
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
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                    tipoBusca === tipo.id
                      ? 'border-primary bg-primary/10 text-primary'
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

      {/* Tribunal */}
      <Card>
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

      {/* Formulário de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {tipoBusca === 'numero' && 'Buscar por Número do Processo'}
            {tipoBusca === 'parte' && 'Buscar por Nome da Parte'}
            {tipoBusca === 'classe' && 'Buscar por Classe Processual'}
            {tipoBusca === 'avancada' && 'Busca Avançada'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Resultados da Busca
              <Badge variant="info" className="ml-2">
                {totalEncontrado} encontrado(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultados.map((processo, index) => {
              // Debug: ver estrutura do processo
              if (index === 0) {
                console.log('🔍 Estrutura do processo:', processo)
                console.log('📅 dataAjuizamento:', processo.dataAjuizamento, processo.dadosBasicos?.dataAjuizamento)
                console.log('📋 movimentos:', processo.movimentos?.length)
              }
              
              const info = extrairInfoProcesso(processo)
              
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-soft hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    {/* Cabeçalho do Processo */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <p className="font-mono text-base font-bold text-primary">
                          {formatarNumeroProcesso(info.numero)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="info" className="text-xs">{info.tribunal}</Badge>
                          <Badge className="text-xs">{renderValue(info.classe)}</Badge>
                          <Badge variant="default" className="text-xs">{processo.grau}</Badge>
                          {processo.sistema && (
                            <Badge variant="default" className="text-xs">
                              {renderValue(processo.sistema)}
                            </Badge>
                          )}
                          {processo.formato && (
                            <Badge variant="default" className="text-xs">
                              {renderValue(processo.formato)}
                            </Badge>
                          )}
                          {processo.nivelSigilo !== undefined && (
                            <Badge variant={processo.nivelSigilo === 0 ? "success" : "warning"} className="text-xs">
                              {processo.nivelSigilo === 0 ? "Público" : `Sigilo ${processo.nivelSigilo}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Informações Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-text-muted text-xs mb-1">Órgão Julgador</p>
                        <p className="text-text font-medium">{renderValue(info.orgao)}</p>
                        {processo.orgaoJulgador?.codigoMunicipioIBGE && (
                          <p className="text-text-muted text-[10px] mt-0.5">
                            IBGE: {processo.orgaoJulgador.codigoMunicipioIBGE}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-text-muted text-xs mb-1">Data Ajuizamento</p>
                        <p className="text-text font-medium">{info.dataAjuizamento}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs mb-1">Última Atualização</p>
                        <p className="text-text font-medium">
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
                    </div>

                    {/* ID e Sistema */}
                    {processo.id && (
                      <div className="text-xs text-text-muted font-mono bg-surface p-2 rounded border">
                        <span className="font-semibold">ID:</span> {processo.id}
                      </div>
                    )}

                    {/* Assuntos */}
                    {processo.assuntos && processo.assuntos.length > 0 && (
                      <div>
                        <p className="text-text-muted text-xs mb-2">Assuntos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {processo.assuntos.map((assunto, idx) => (
                            <Badge key={idx} variant="default" className="text-xs" title={`Código: ${assunto.codigo}`}>
                              {assunto.nome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico de Movimentações */}
                    {processo.movimentos && processo.movimentos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-text font-semibold text-base">
                            Histórico de Movimentações
                          </p>
                          <Badge variant="info" className="ml-auto">
                            {processo.movimentos.length} movimentações
                          </Badge>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-surface shadow-inner">
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
                                className="flex gap-4 p-3 rounded-lg bg-surface-2 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                              >
                                <div className="flex-shrink-0 flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  {idx < (processo.movimentos?.filter((m: any) => m.nome).length || 0) - 1 && (
                                    <div className="w-px h-full bg-border mt-2"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-text leading-snug">
                                        {mov.nome}
                                      </p>
                                      {mov.codigo && (
                                        <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                                          Código: {mov.codigo}
                                          {mov.codigoNacional && ` • Nacional: ${mov.codigoNacional}`}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="default" className="text-[10px] flex-shrink-0">
                                        {mov.dataHora
                                          ? new Date(mov.dataHora).toLocaleDateString('pt-BR', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                            })
                                          : 'Sem data'}
                                      </Badge>
                                      {mov.dataHora && (
                                        <span className="text-[10px] text-text-muted">
                                          {new Date(mov.dataHora).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Complemento em texto */}
                                  {mov.complemento && (
                                    <div className="mb-2 p-2 bg-surface rounded text-xs text-text border-l-2 border-primary/30">
                                      {mov.complemento}
                                    </div>
                                  )}
                                  
                                  {/* Complementos Tabelados Detalhados */}
                                  {mov.complementosTabelados && mov.complementosTabelados.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                      <p className="text-xs text-text-muted font-medium mb-2">📋 Detalhes:</p>
                                      <div className="space-y-1.5">
                                        {mov.complementosTabelados.map((c: any, cIdx: number) => (
                                          <div key={cIdx} className="text-xs bg-info/10 p-2 rounded border border-info/20">
                                            <div className="flex items-start gap-2">
                                              <span className="text-info font-semibold">•</span>
                                              <div className="flex-1">
                                                <p className="text-text font-medium">{c.nome}</p>
                                                {c.descricao && (
                                                  <p className="text-text-muted text-[10px] mt-0.5">
                                                    {c.descricao.replace(/_/g, ' ')}
                                                  </p>
                                                )}
                                                <div className="flex gap-3 mt-1">
                                                  {c.codigo && (
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                      Cód: {c.codigo}
                                                    </span>
                                                  )}
                                                  {c.valor && (
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                      Val: {c.valor}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formatarNumeroProcesso(info.numero))
                          toast.success('Número copiado!')
                        }}
                      >
                        Copiar Número
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => exportarProcessoParaPDF(processo)}
                        className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 border-0"
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
                        Importar para Casos
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
  )
}
