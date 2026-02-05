import * as React from 'react'
import { Search, RefreshCw, AlertCircle, Newspaper, Building2, UserCheck, ExternalLink, Filter, Calendar, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  buscarDiariosOficiais,
  buscarPublicacoesProcesso,
  buscarEmpresaPorCnpj,
  buscarSociosPorCnpj,
  formatarSituacaoCadastral,
  formatarCnpj,
  formatarData,
  limparExcerpt,
  ESTADOS_BRASIL,
  type GazetteSearchResponse,
  type GazetteItem,
  type CompanyInfo,
  type PartnersResponse,
} from '@/services/queridoDiarioService'
import { cn } from '@/utils/cn'

type TipoBusca = 'texto' | 'processo' | 'cnpj'

export const DiarioOficialPage = () => {
  const [buscando, setBuscando] = React.useState(false)
  const [tipoBusca, setTipoBusca] = React.useState<TipoBusca>('texto')
  
  // Campos de busca
  const [textoBusca, setTextoBusca] = React.useState('')
  const [numeroProcesso, setNumeroProcesso] = React.useState('')
  const [cnpj, setCnpj] = React.useState('')
  const [estadoFiltro, setEstadoFiltro] = React.useState<string>('')
  const [dataInicio, setDataInicio] = React.useState('')
  const [dataFim, setDataFim] = React.useState('')
  
  // Resultados
  const [publicacoes, setPublicacoes] = React.useState<GazetteSearchResponse | null>(null)
  const [empresaInfo, setEmpresaInfo] = React.useState<CompanyInfo | null>(null)
  const [sociosInfo, setSociosInfo] = React.useState<PartnersResponse | null>(null)

  // Formatar CNPJ enquanto digita
  const formatarCnpjInput = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    return numeros
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18)
  }

  const handleBuscar = async () => {
    setBuscando(true)
    setPublicacoes(null)
    setEmpresaInfo(null)
    setSociosInfo(null)
    
    try {
      switch (tipoBusca) {
        case 'texto':
          if (!textoBusca.trim()) {
            toast.error('Digite um termo para buscar')
            setBuscando(false)
            return
          }
          
          const resultadoTexto = await buscarDiariosOficiais(textoBusca, {
            stateCodes: estadoFiltro ? [estadoFiltro] : undefined,
            publishedSince: dataInicio || undefined,
            publishedUntil: dataFim || undefined,
            size: 30
          })
          
          setPublicacoes(resultadoTexto)
          
          if (resultadoTexto.total_gazettes === 0) {
            toast.info('Nenhuma publicação encontrada')
          } else {
            toast.success(`${resultadoTexto.total_gazettes} publicação(ões) encontrada(s)`)
          }
          break
          
        case 'processo':
          if (!numeroProcesso.trim()) {
            toast.error('Digite o número do processo')
            setBuscando(false)
            return
          }
          
          const resultadoProcesso = await buscarPublicacoesProcesso(numeroProcesso, {
            stateCodes: estadoFiltro ? [estadoFiltro] : undefined,
            size: 30
          })
          
          setPublicacoes(resultadoProcesso)
          
          if (resultadoProcesso.total_gazettes === 0) {
            toast.info('Nenhuma publicação encontrada para este processo')
          } else {
            toast.success(`${resultadoProcesso.total_gazettes} publicação(ões) encontrada(s)`)
          }
          break
          
        case 'cnpj':
          if (!cnpj.trim()) {
            toast.error('Digite o CNPJ')
            setBuscando(false)
            return
          }
          
          const cnpjLimpo = cnpj.replace(/\D/g, '')
          if (cnpjLimpo.length !== 14) {
            toast.error('CNPJ deve ter 14 dígitos')
            setBuscando(false)
            return
          }
          
          // Buscar dados da empresa e publicações em paralelo
          const [empresa, socios, pubsEmpresa] = await Promise.all([
            buscarEmpresaPorCnpj(cnpjLimpo).catch(() => null),
            buscarSociosPorCnpj(cnpjLimpo).catch(() => null),
            buscarDiariosOficiais(cnpjLimpo, {
              stateCodes: estadoFiltro ? [estadoFiltro] : undefined,
              publishedSince: dataInicio || undefined,
              publishedUntil: dataFim || undefined,
              size: 30
            }).catch(() => null)
          ])
          
          setEmpresaInfo(empresa)
          setSociosInfo(socios)
          setPublicacoes(pubsEmpresa)
          
          if (empresa) {
            toast.success(`Empresa encontrada: ${empresa.razao_social || empresa.nome_fantasia || 'Sem nome'}`)
          } else {
            toast.warning('Não foi possível obter dados da empresa')
          }
          
          if (pubsEmpresa && pubsEmpresa.total_gazettes > 0) {
            toast.info(`${pubsEmpresa.total_gazettes} publicação(ões) em diários oficiais`)
          }
          break
      }
    } catch (error) {
      console.error('[Diário Oficial] Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar')
    } finally {
      setBuscando(false)
    }
  }

  const limparBusca = () => {
    setTextoBusca('')
    setNumeroProcesso('')
    setCnpj('')
    setEstadoFiltro('')
    setDataInicio('')
    setDataFim('')
    setPublicacoes(null)
    setEmpresaInfo(null)
    setSociosInfo(null)
  }

  return (
    <div className="min-h-screen bg-background px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-info" />
            Diário Oficial
          </h1>
          <p className="text-text-muted">
            Busque publicações em diários oficiais municipais de todo o Brasil via{' '}
            <a 
              href="https://queridodiario.ok.org.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Querido Diário
            </a>
          </p>
        </div>

        {/* Card de Busca */}
        <Card className="border border-border bg-surface/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-5 h-5 text-info" />
              Buscar Publicações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de Busca */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tipoBusca === 'texto' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipoBusca('texto')}
              >
                <Search className="w-4 h-4 mr-2" />
                Texto Livre
              </Button>
              <Button
                variant={tipoBusca === 'processo' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipoBusca('processo')}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Número do Processo
              </Button>
              <Button
                variant={tipoBusca === 'cnpj' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipoBusca('cnpj')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                CNPJ
              </Button>
            </div>

            {/* Campo de busca principal */}
            {tipoBusca === 'texto' && (
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  Termo de Busca
                </label>
                <Input
                  placeholder="Digite palavras-chave, nomes, termos..."
                  value={textoBusca}
                  onChange={(e) => setTextoBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Ex: "licitação", "edital", "contrato", nome de pessoa ou empresa
                </p>
              </div>
            )}

            {tipoBusca === 'processo' && (
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
                <p className="text-[10px] text-text-muted mt-1">
                  Busca o número do processo em editais, intimações e publicações judiciais
                </p>
              </div>
            )}

            {tipoBusca === 'cnpj' && (
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  CNPJ da Empresa
                </label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatarCnpjInput(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  maxLength={18}
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Busca dados cadastrais da empresa + publicações nos diários oficiais
                </p>
              </div>
            )}

            {/* Filtros */}
            <div className="p-3 rounded-lg border border-border bg-surface-2">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-text-muted" />
                <span className="text-xs font-medium text-text">Filtros</span>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Estado
                  </label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full text-xs px-2 py-2 rounded-lg border border-border bg-surface text-text"
                  >
                    <option value="">Todos os estados</option>
                    {ESTADOS_BRASIL.map(estado => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.sigla} - {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-text-muted mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data Início
                  </label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="text-xs"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-text-muted mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data Fim
                  </label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={handleBuscar}
                disabled={buscando}
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

        {/* Resultados: Dados da Empresa (CNPJ) */}
        {empresaInfo && (
          <Card className="border border-success/30 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-5 h-5 text-success" />
                Dados da Empresa
                <Badge 
                  variant={formatarSituacaoCadastral(empresaInfo.situacao_cadastral).cor === 'green' ? 'success' : 
                           formatarSituacaoCadastral(empresaInfo.situacao_cadastral).cor === 'red' ? 'danger' : 'default'}
                  className="ml-2"
                >
                  {formatarSituacaoCadastral(empresaInfo.situacao_cadastral).texto}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-text">
                  {empresaInfo.razao_social || empresaInfo.nome_fantasia || 'Empresa sem nome'}
                </p>
                {empresaInfo.nome_fantasia && empresaInfo.razao_social && (
                  <p className="text-sm text-text-muted">
                    Nome Fantasia: {empresaInfo.nome_fantasia}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs">CNPJ</p>
                  <p className="font-mono text-text">{formatarCnpj(empresaInfo.cnpj_completo_apenas_numeros || cnpj)}</p>
                </div>
                {empresaInfo.data_inicio_atividade && (
                  <div>
                    <p className="text-text-muted text-xs">Início Atividade</p>
                    <p className="text-text">{formatarData(empresaInfo.data_inicio_atividade)}</p>
                  </div>
                )}
                {empresaInfo.capital_social && (
                  <div>
                    <p className="text-text-muted text-xs">Capital Social</p>
                    <p className="text-text">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(parseFloat(empresaInfo.capital_social.replace(',', '.')))}
                    </p>
                  </div>
                )}
                {empresaInfo.natureza_juridica && (
                  <div className="col-span-2">
                    <p className="text-text-muted text-xs">Natureza Jurídica</p>
                    <p className="text-text">{empresaInfo.natureza_juridica}</p>
                  </div>
                )}
                {empresaInfo.cnae && (
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-text-muted text-xs">CNAE Principal</p>
                    <p className="text-text">{empresaInfo.cnae}</p>
                  </div>
                )}
                {(empresaInfo.logradouro || empresaInfo.municipio) && (
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-text-muted text-xs">Endereço</p>
                    <p className="text-text">
                      {[
                        empresaInfo.logradouro,
                        empresaInfo.numero,
                        empresaInfo.complemento,
                        empresaInfo.bairro,
                        empresaInfo.municipio,
                        empresaInfo.uf,
                        empresaInfo.cep && `CEP: ${empresaInfo.cep}`
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {empresaInfo.correio_eletronico && (
                  <div>
                    <p className="text-text-muted text-xs">E-mail</p>
                    <p className="text-text text-[11px]">{empresaInfo.correio_eletronico.toLowerCase()}</p>
                  </div>
                )}
                {empresaInfo.ddd_telefone_1 && (
                  <div>
                    <p className="text-text-muted text-xs">Telefone</p>
                    <p className="text-text">{empresaInfo.ddd_telefone_1}</p>
                  </div>
                )}
              </div>
              
              {/* Sócios */}
              {sociosInfo && sociosInfo.total_partners > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-text-muted" />
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Quadro Societário ({sociosInfo.total_partners})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sociosInfo.partners.slice(0, 8).map((socio, idx) => (
                      <div key={idx} className="p-3 rounded bg-surface border border-border text-sm">
                        <p className="font-medium text-text">{socio.razao_social || '-'}</p>
                        <div className="flex flex-wrap items-center gap-2 text-text-muted mt-1 text-xs">
                          {socio.qualificacao_socio && (
                            <Badge variant="default" className="text-[10px]">
                              {socio.qualificacao_socio}
                            </Badge>
                          )}
                          {socio.data_entrada_sociedade && (
                            <span>Desde: {formatarData(socio.data_entrada_sociedade)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {sociosInfo.total_partners > 8 && (
                    <p className="text-xs text-text-muted mt-2">
                      + {sociosInfo.total_partners - 8} sócio(s) não exibido(s)
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados: Publicações */}
        {publicacoes && (
          <Card className="border border-info/30 bg-info/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-info" />
                Publicações em Diários Oficiais
                <Badge variant="info" className="ml-2">
                  {publicacoes.total_gazettes} encontrada(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {publicacoes.total_gazettes > 0 ? (
                <>
                  {publicacoes.gazettes.slice(0, 20).map((pub, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-surface border border-border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {pub.state_code}
                          </Badge>
                          <p className="text-sm font-medium text-text">
                            {pub.territory_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted">
                            {new Date(pub.date).toLocaleDateString('pt-BR')}
                          </p>
                          {pub.edition && (
                            <p className="text-[10px] text-text-muted">
                              Edição: {pub.edition}
                              {pub.is_extra_edition && ' (Extra)'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {pub.excerpts && pub.excerpts.length > 0 && (
                        <div className="text-sm text-text-muted leading-relaxed p-3 bg-surface-2 rounded-lg mt-2">
                          {pub.excerpts.map((excerpt, exIdx) => (
                            <p 
                              key={exIdx}
                              className="mb-2 last:mb-0"
                              dangerouslySetInnerHTML={{ 
                                __html: excerpt
                                  .replace(/<mark>/g, '<mark class="bg-warning/40 rounded px-0.5">')
                              }} 
                            />
                          ))}
                        </div>
                      )}
                      
                      {pub.url && (
                        <a 
                          href={pub.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver publicação original
                        </a>
                      )}
                    </div>
                  ))}
                  
                  {publicacoes.total_gazettes > 20 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-text-muted">
                        Mostrando 20 de {publicacoes.total_gazettes} publicações
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Refine sua busca para ver resultados mais específicos
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-muted">
                    Nenhuma publicação encontrada nos diários oficiais municipais.
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    💡 Tente buscar com termos diferentes ou remover os filtros de estado/data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informação sobre a fonte */}
        <div className="text-center text-xs text-text-muted pt-4">
          <p>
            Dados fornecidos por{' '}
            <a 
              href="https://queridodiario.ok.org.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Querido Diário
            </a>
            {' '}(Open Knowledge Brasil) - Diários Oficiais Municipais
          </p>
          <p className="mt-1">
            Os dados de empresas são obtidos da base pública da Receita Federal
          </p>
        </div>
      </div>
    </div>
  )
}
