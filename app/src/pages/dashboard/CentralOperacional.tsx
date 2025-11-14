import React, { useEffect, useMemo, useState } from 'react';
import BasePage from '../../components/BasePage';
import MapaMinas from '../../components/MapaMinas';
import { Link } from 'react-router-dom';
import { MEDIA_GERAL, MACRO_REGIOES_PERFORMANCE } from '../../data/macroRegioesPerformance';

const KPIS = [
  {
    label: 'Média estadual ENEM',
    value: '662 pontos',
    trend: '+12 vs ano anterior',
    color: 'text-blue-300',
  },
  {
    label: 'Municípios acompanhados',
    value: '853',
    trend: '100% da rede',
    color: 'text-emerald-300',
  },
  {
    label: 'Alunos ativos',
    value: '128.940',
    trend: '+4.120 esta semana',
    color: 'text-purple-300',
  },
  {
    label: 'Tempo médio de estudo',
    value: '2h47/dia',
    trend: 'meta: 3h15',
    color: 'text-amber-300',
  },
];

const getBadgeByMedia = (media: number) => {
  if (media >= MEDIA_GERAL + 30) return { label: 'Nível Ouro', color: 'text-emerald-300' };
  if (media >= MEDIA_GERAL) return { label: 'Estável', color: 'text-blue-300' };
  if (media >= MEDIA_GERAL - 30) return { label: 'Atenção', color: 'text-amber-300' };
  return { label: 'Missão Prioritária', color: 'text-rose-300' };
};
export default function CentralOperacional() {
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const [selectedMacroId, setSelectedMacroId] = useState<string>(MACRO_REGIOES_PERFORMANCE[0]?.id ?? '');
  const selectedMacro = MACRO_REGIOES_PERFORMANCE.find((macro) => macro.id === selectedMacroId);
  const [municipiosRegiao, setMunicipiosRegiao] = useState<Array<{ nome: string; media: number }>>([]);
  const [cidadesCarregando, setCidadesCarregando] = useState(false);
  const [erroCidades, setErroCidades] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMacroId) return;
    setCidadesCarregando(true);
    setErroCidades(null);

    const controller = new AbortController();
    const carregar = async () => {
      try {
        const resposta = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/mesorregioes/${selectedMacroId}/municipios`,
          { signal: controller.signal }
        );
        if (!resposta.ok) throw new Error(`Falha ${resposta.status}`);
        const dados = await resposta.json();
        const base = selectedMacro?.mediaEnem ?? MEDIA_GERAL;
        const lista = dados.map((municipio: { nome: string }, idx: number, arr: any[]) => {
          const ajuste = (idx - arr.length / 2) * 0.6;
          const media = Math.max(620, Math.min(780, Math.round(base + ajuste)));
          return { nome: municipio.nome, media };
        });
        setMunicipiosRegiao(lista);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('Erro ao buscar municípios da macro', selectedMacroId, err);
          setErroCidades('Não foi possível carregar os municípios agora.');
          setMunicipiosRegiao([]);
        }
      } finally {
        setCidadesCarregando(false);
      }
    };
    void carregar();
    return () => controller.abort();
  }, [selectedMacroId, selectedMacro?.mediaEnem]);

  const painelInfo = useMemo(() => {
    const layer = hoveredFeature?.properties?.layer;
    if (!hoveredFeature || !layer) {
      return {
        titulo: selectedMacro?.nome ?? 'Rede Municipal de Minas Gerais',
        linha1: `${selectedMacro?.municipios.length ?? 0} municípios monitorados`,
        linha2: `Média regional: ${selectedMacro?.mediaEnem ?? '—'} pts`,
      };
    }
    if (layer === 'macroregiao') {
      return {
        titulo: hoveredFeature.properties?.nome ?? 'Macroregião',
        linha1: `${hoveredFeature.properties?.municipios ?? 'Dezenas de municípios monitorados'}`,
        linha2: 'Situação: monitoramento em tempo real',
      };
    }
    if (layer === 'municipio') {
      return {
        titulo: hoveredFeature.properties?.nome ?? 'Município',
        linha1: [
          hoveredFeature.properties?.microrregiao,
          hoveredFeature.properties?.mesorregiao,
        ]
          .filter(Boolean)
          .join(' • ') || 'Rede municipal',
        linha2: `Região intermediária: ${
          hoveredFeature.properties?.regiao_intermediaria ?? 'n/d'
        }`,
      };
    }
    return {
      titulo: selectedMacro?.nome ?? 'Minas Gerais',
      linha1: `${selectedMacro?.municipios.length ?? 0} municípios monitorados`,
      linha2: `Média regional: ${selectedMacro?.mediaEnem ?? '—'} pts`,
    };
  }, [hoveredFeature, selectedMacro]);

  return (
    <BasePage fullWidth contentClassName="py-10">
      <div className="w-full px-4 md:px-8 2xl:px-16 space-y-10">
        <header className="glass-card p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Central Operacional</p>
            <h1 className="text-3xl font-semibold text-white">Acompanhamento de desempenho geral</h1>
            <p className="text-slate-400 max-w-3xl">
              Visualize a distribuição dos resultados por município, acompanhe regiões prioritárias e tome decisões integradas
              com base no mapa oficial da rede municipal.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/home" className="btn-ghost px-5 h-12">↩️ Voltar ao painel</Link>
            <Link to="/estatisticas" className="btn-primary px-6 h-12">📊 Ver estatísticas detalhadas</Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="glass-card p-5 space-y-1">
              <p className="text-sm text-slate-400">{kpi.label}</p>
              <p className="text-3xl font-semibold text-white">{kpi.value}</p>
              <p className={`text-xs ${kpi.color}`}>{kpi.trend}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)_360px] items-stretch">
          <aside className="glass-card p-5 order-2 2xl:order-1 flex flex-col gap-4 overflow-hidden">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Cidades em destaque</p>
              <h3 className="text-lg font-semibold text-white">{selectedMacro?.nome ?? '—'}</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full text-sm text-slate-300 space-y-2 overflow-y-auto pr-2">
                {cidadesCarregando && <p className="text-xs text-slate-500">Carregando municípios...</p>}
                {erroCidades && <p className="text-xs text-rose-400">{erroCidades}</p>}
                {!cidadesCarregando && !erroCidades && (
                  <ul className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-3 pb-2">
                    {municipiosRegiao.map((cidade) => {
                      const abaixoMedia = cidade.media < MEDIA_GERAL;
                      return (
                        <li key={cidade.nome} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                            <span className="truncate">{cidade.nome}</span>
                          </div>
                          <span
                            className={`font-semibold whitespace-nowrap ${
                              abaixoMedia ? 'text-rose-300' : 'text-white'
                            }`}
                          >
                            {cidade.media} pts
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </aside>

          <div className="glass-card p-4 md:p-6 order-1 2xl:order-2 flex flex-col min-h-[620px]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cobertura territorial</p>
                <h2 className="text-2xl font-semibold text-white">Mapa GeoJSON oficial</h2>
                <p className="text-sm text-slate-400">Municípios + macroregiões com camadas interativas</p>
              </div>
              <div className="text-xs text-slate-400">
                Arquivo: <code>/geo/minas-municipios-macro.geojson</code>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <MapaMinas
                className="w-full h-full"
                aspectRatio={1}
                minHeight={620}
              projectionScale={2400}
              center={[-45, -19.2]}
              selectedMacroId={selectedMacroId}
              onFeatureHover={setHoveredFeature}
              onFeatureClick={(feature) => {
                if (feature.properties?.layer === 'macroregiao') {
                  const id = feature.properties?.cod_meso ?? feature.properties?.codarea;
                  if (id) setSelectedMacroId(String(id));
                }
              }}
            />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-400" />
                <span>≥ média estadual ({MEDIA_GERAL})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-rose-400/80 border border-rose-400" />
                <span>&lt; média estadual</span>
              </div>
            </div>
          </div>

          <aside className="glass-card p-4 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Área selecionada</p>
              <h3 className="text-xl font-semibold text-white">{painelInfo.titulo}</h3>
              <p className="text-sm text-slate-300">{painelInfo.linha1}</p>
              <p className="text-xs text-slate-500">{painelInfo.linha2}</p>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {MACRO_REGIOES_PERFORMANCE.map((item) => {
                const badge = getBadgeByMedia(item.mediaEnem);
                const active = item.id === selectedMacroId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMacroId(item.id)}
                    className={`w-full text-left border rounded-xl p-3 transition ${
                      active
                        ? 'border-yellow-300/60 bg-yellow-300/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{item.nome}</span>
                      <span className={`text-xs ${badge.color}`}>{badge.label}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{item.mediaEnem} pontos</p>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="glass-card p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Integrações</p>
              <h2 className="text-2xl font-semibold text-white">Indicadores em tempo real</h2>
            </div>
            <div className="text-xs text-slate-400">Atualizado às 07:30 &bull; fonte: diário de bordo escolar</div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[{
              label: 'Escolas sincronizadas',
              value: '1.247',
              extra: '96% com telemetria ativa',
            }, {
              label: 'Alertas críticos',
              value: '12',
              extra: 'Merenda / conectividade',
            }, {
              label: 'Planos de ação monitorados',
              value: '74',
              extra: 'Etapa municipal',
            }].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="text-3xl font-semibold text-white">{card.value}</p>
                <p className="text-xs text-blue-300">{card.extra}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BasePage>
  );
}
