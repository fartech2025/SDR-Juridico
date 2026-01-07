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
  { id: 'trf1', nome: 'TRF1 - Tribunal Regional Federal 1ª Região' },
  { id: 'trf2', nome: 'TRF2 - Tribunal Regional Federal 2ª Região' },
  { id: 'trf3', nome: 'TRF3 - Tribunal Regional Federal 3ª Região' },
  { id: 'trf4', nome: 'TRF4 - Tribunal Regional Federal 4ª Região' },
  { id: 'trf5', nome: 'TRF5 - Tribunal Regional Federal 5ª Região' },
  { id: 'trf6', nome: 'TRF6 - Tribunal Regional Federal 6ª Região' },
  { id: 'tst', nome: 'TST - Tribunal Superior do Trabalho' },
  { id: 'stj', nome: 'STJ - Superior Tribunal de Justiça' },
  { id: 'tse', nome: 'TSE - Tribunal Superior Eleitoral' },
  { id: 'stm', nome: 'STM - Superior Tribunal Militar' },
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
