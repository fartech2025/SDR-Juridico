import * as React from 'react'
import { Search, RefreshCw, AlertCircle, Database, FileText, Users, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import heroLight from '@/assets/hero-light.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  isDataJudConfigured,
  testarConexao,
  buscarProcessoPorNumero,
  buscarProcessosPorParte,
  buscarProcessosPorClasse,
  buscaAvancada,
  extrairInfoProcesso,
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
            return
          }
          resultado = await buscarProcessoPorNumero(numeroProcesso, tribunal)
          break

        case 'parte':
          if (!nomeParte.trim()) {
            toast.error('Digite o nome da parte')
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

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-soft"
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
            className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              const info = extrairInfoProcesso(processo)
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-white p-4 shadow-soft hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-semibold text-primary">
                          {info.numero}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="info">{info.tribunal}</Badge>
                          <Badge>{info.classe}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="text-text-muted">Órgão:</span>{' '}
                        <span className="text-text">{info.orgao}</span>
                      </p>
                      <p>
                        <span className="text-text-muted">Assunto:</span>{' '}
                        <span className="text-text">{info.assunto}</span>
                      </p>
                      <p>
                        <span className="text-text-muted">Data Ajuizamento:</span>{' '}
                        <span className="text-text">{info.dataAjuizamento}</span>
                      </p>
                      {info.partes.length > 0 && (
                        <p>
                          <span className="text-text-muted">Partes:</span>{' '}
                          <span className="text-text">
                            {info.partes.map((p) => p.nome).join(', ')}
                          </span>
                        </p>
                      )}
                      <p>
                        <span className="text-text-muted">Movimentações:</span>{' '}
                        <span className="text-text">{info.totalMovimentacoes}</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Copiar número do processo
                          navigator.clipboard.writeText(info.numero)
                          toast.success('Número copiado!')
                        }}
                      >
                        Copiar Número
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Importar para casos
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
