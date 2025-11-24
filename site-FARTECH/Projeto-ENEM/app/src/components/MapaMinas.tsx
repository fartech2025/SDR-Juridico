import React, { useEffect, useMemo, useState } from 'react'
import { geoCentroid, geoMercator, geoPath } from 'd3-geo'
import { MACRO_REGIOES_PERFORMANCE, MEDIA_GERAL } from '../data/macroRegioesPerformance'

const LAYER_STYLES: Record<string, (props?: any) => { fill: string; stroke: string }> = {
  estado: () => ({
    fill: 'transparent',
    stroke: '#e2e8f0',
  }),
  macroregiao: (props) => {
    const performance = MACRO_REGIOES_PERFORMANCE.find((m) => m.id === (props?.cod_meso ?? props?.codarea))
    const abaixoMedia = performance ? performance.mediaEnem < MEDIA_GERAL : false
    return {
      fill: 'transparent',
      stroke: abaixoMedia ? '#f87171' : '#4ade80',
    }
  },
  municipio: () => ({
    fill: 'transparent',
    stroke: 'rgba(148,163,184,0.35)',
  }),
}

const DEFAULT_CENTER: [number, number] = [-44.5, -18.6]
const MAP_SIZE = 600

interface Props {
  dataUrl?: string
  className?: string
  minHeight?: number
  projectionScale?: number
  center?: [number, number]
  selectedMacroId?: string | null
  onFeatureClick?: (f: any) => void
  onFeatureHover?: (f: any | null) => void
  macroOnly?: boolean
  showLabels?: boolean
}

export default function MapaMinas({
  dataUrl = '/geo/minas-municipios-macro.geojson',
  className,
  minHeight = 400,
  projectionScale = 6200,
  center = DEFAULT_CENTER,
  selectedMacroId = null,
  onFeatureClick,
  onFeatureHover,
  macroOnly = false,
  showLabels = true,
}: Props) {
  const [features, setFeatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    setIsLoading(true)
    fetch(dataUrl)
      .then((response) => response.json())
      .then((geojson) => {
        if (!isActive) return
        setFeatures(Array.isArray(geojson?.features) ? geojson.features : [])
      })
      .catch((error) => {
        console.error('Erro ao carregar mapa de MG', error)
        if (isActive) setFeatures([])
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [dataUrl])

  const projectionMemo = useMemo(() => {
    return geoMercator().center(center).scale(projectionScale).translate([MAP_SIZE / 2, MAP_SIZE / 2])
  }, [center, projectionScale])

  const pathGenerator = useMemo(() => geoPath(projectionMemo), [projectionMemo])

  const emitHover = (feature: any | null, enhancedProperties?: any) => {
    if (!onFeatureHover) return
    if (!feature) {
      onFeatureHover(null)
      return
    }
    onFeatureHover({
      ...feature,
      properties: enhancedProperties ?? feature.properties,
    })
  }

  return (
    <div className={className} style={{ minHeight, background: 'transparent', position: 'relative' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Carregando mapa...
        </div>
      )}
      <svg
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        {features.map((feature, index) => {
          const layer = feature.properties?.layer ?? 'municipio'
          if (macroOnly && layer === 'municipio') {
            return null
          }

          const rawId = feature.properties?.cod_meso ?? feature.properties?.codarea ?? ''
          const macroId = rawId ? String(rawId) : ''
          const colors = (LAYER_STYLES[layer] ?? LAYER_STYLES.municipio)(feature.properties)
          const isSelected = layer === 'macroregiao' && selectedMacroId && macroId === selectedMacroId
          const macroPerformance =
            layer === 'macroregiao' ? MACRO_REGIOES_PERFORMANCE.find((m) => m.id === macroId) : undefined
          const enhancedProperties =
            layer === 'macroregiao' && macroPerformance
              ? {
                  ...feature.properties,
                  nome: macroPerformance.nome,
                  municipios: `${macroPerformance.municipios.length} municípios monitorados`,
                  mediaEnem: macroPerformance.mediaEnem,
                }
              : feature.properties
          const path = pathGenerator(feature as any)
          if (!path) return null

          const strokeWidth =
            layer === 'estado' ? 1.2 : layer === 'macroregiao' ? (isSelected ? 1.2 : 0.8) : 0.35

          const handleClick = () => {
            if (!onFeatureClick) return
            onFeatureClick({
              ...feature,
              properties: enhancedProperties,
            })
          }

          return (
            <path
              key={`feature-${feature.id ?? index}`}
              d={path}
              fill={colors.fill}
              stroke={isSelected ? '#fef08a' : colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              onMouseEnter={() => emitHover(feature, enhancedProperties)}
              onMouseLeave={() => emitHover(null)}
              onClick={handleClick}
              style={{
                cursor: layer === 'macroregiao' && onFeatureClick ? 'pointer' : 'default',
                transition: 'stroke 0.2s ease',
              }}
            />
          )
        })}

        {showLabels &&
          features
            .filter((feature) => feature.properties?.layer === 'macroregiao')
            .map((feature, index) => {
              const centroid = geoCentroid(feature as any)
              const projected = projectionMemo(centroid as [number, number])
              const performance = MACRO_REGIOES_PERFORMANCE.find(
                (m) => m.id === String(feature.properties?.cod_meso ?? feature.properties?.codarea ?? '')
              )
              if (!performance || !projected) return null
              const [x, y] = projected
              const labelWidth = 120
              const labelHeight = 34
              return (
                <g key={`label-${feature.id ?? index}`}>
                  <rect
                    x={x - labelWidth / 2}
                    y={y - labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    rx={8}
                    fill="rgba(2,6,23,0.75)"
                    stroke="rgba(15,23,42,0.8)"
                    strokeWidth={0.6}
                  />
                  <text x={x} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={500} fill="#cbd5f5">
                    {performance.nome}
                  </text>
                  <text x={x} y={y + 9} textAnchor="middle" fontSize={12} fontWeight={700} fill="#f8fafc">
                    {performance.mediaEnem} pts
                  </text>
                </g>
              )
            })}
      </svg>
    </div>
  )
}
