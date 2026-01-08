import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, History, TrendingUp, BarChart3, Clock, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  listarFavoritos,
  listarHistorico,
  obterEstatisticas,
  type ProcessoFavorito,
  type HistoricoConsulta
} from '@/services/favoritosService'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = React.useState<ProcessoFavorito[]>([])
  const [historico, setHistorico] = React.useState<HistoricoConsulta[]>([])
  const [estatisticas, setEstatisticas] = React.useState({
    totalConsultas: 0,
    processosUnicos: 0,
    tribunaisMaisConsultados: [] as Array<{ tribunal: string; total: number }>,
    consultasRecentes: 0
  })
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    try {
      const [favResult, histResult, stats] = await Promise.all([
        listarFavoritos(),
        listarHistorico(10),
        obterEstatisticas()
      ])

      if (favResult.data) setFavoritos(favResult.data)
      if (histResult.data) setHistorico(histResult.data)
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
          <p className="text-text-muted mt-1">
            Acompanhe suas consultas e processos favoritos
          </p>
        </div>
        <Button onClick={() => navigate('/datajud')}>
          Voltar para Consultas
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalConsultas}</div>
            <p className="text-xs text-muted-foreground">
              Todas as consultas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Únicos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.processosUnicos}</div>
            <p className="text-xs text-muted-foreground">
              Processos diferentes consultados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos 7 Dias</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.consultasRecentes}</div>
            <p className="text-xs text-muted-foreground">
              Consultas recentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoritos.length}</div>
            <p className="text-xs text-muted-foreground">
              Processos acompanhados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tribunais Mais Consultados */}
      {estatisticas.tribunaisMaisConsultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Tribunais Mais Consultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estatisticas.tribunaisMaisConsultados.map(({ tribunal, total }) => (
                <div key={tribunal} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tribunal}</span>
                  <Badge variant="info">{total} consultas</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processos Favoritos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Processos Favoritos ({favoritos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoritos.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum processo favorito</p>
                <p className="text-sm mt-1">
                  Marque processos como favoritos para acompanhá-los aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {favoritos.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-3 border border-border rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
                    onClick={() => {
                      navigate(`/datajud?processo=${fav.numero_processo}`)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{fav.numero_processo}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {fav.tribunal}
                        </p>
                        {fav.classe && (
                          <Badge variant="default" className="mt-2 text-xs">
                            {fav.classe}
                          </Badge>
                        )}
                        {fav.tags && fav.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fav.tags.map((tag, idx) => (
                              <Badge key={idx} variant="info" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {fav.descricao && (
                      <p className="text-xs text-text-muted mt-2 italic">
                        {fav.descricao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma consulta realizada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border border-border rounded hover:bg-surface-2 transition-colors cursor-pointer"
                    onClick={() => {
                      navigate(`/datajud?processo=${item.numero_processo}`)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.numero_processo}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.tribunal}
                        </p>
                      </div>
                      <div className="text-xs text-text-muted ml-2">
                        {new Date(item.consultado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
