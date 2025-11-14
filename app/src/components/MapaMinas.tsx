import React, { useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps'
import { geoCentroid, geoMercator } from 'd3-geo'
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
}: Props) {
  const projectionMemo = useMemo(() => {
    return geoMercator().center(center).scale(projectionScale).translate([MAP_SIZE / 2, MAP_SIZE / 2])
  }, [center, projectionScale])

  return (
    <div className={className} style={{ minHeight, background: 'transparent' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: projectionScale, center }}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        <Geographies geography={dataUrl}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => {
                const layer = geo.properties?.layer ?? 'municipio'
                const rawId = geo.properties?.cod_meso ?? geo.properties?.codarea ?? ''
                const macroId = rawId ? String(rawId) : ''
                const colors = (LAYER_STYLES[layer] ?? LAYER_STYLES.municipio)(geo.properties)
                const isSelected =
                  layer === 'macroregiao' &&
                  selectedMacroId &&
                  selectedMacroId === macroId
                const macroPerformance =
                  layer === 'macroregiao'
                    ? MACRO_REGIOES_PERFORMANCE.find(
                        (m) => m.id === macroId
                      )
                    : undefined
                const enhancedProperties =
                  layer === 'macroregiao' && macroPerformance
                    ? {
                        ...geo.properties,
                        nome: macroPerformance.nome,
                        municipios: `${macroPerformance.municipios.length} municípios monitorados`,
                        mediaEnem: macroPerformance.mediaEnem,
                      }
                    : geo.properties
                const handleHover = (feature: any | null) => {
                  if (!onFeatureHover) return
                  if (!feature) {
                    onFeatureHover(null)
                    return
                  }
                  onFeatureHover({
                    ...feature,
                    properties: enhancedProperties,
                  })
                }
                const handleClick = () => {
                  if (!onFeatureClick) return
                  onFeatureClick({
                    ...geo,
                    properties: enhancedProperties,
                  })
                }
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => handleHover(geo)}
                    onMouseLeave={() => handleHover(null)}
                    onClick={handleClick}
                    style={{
                      default: {
                        fill: colors.fill,
                        stroke: isSelected ? '#fef08a' : colors.stroke,
                        strokeWidth: layer === 'estado' ? 1.2 : layer === 'macroregiao' ? (isSelected ? 1.2 : 0.8) : 0.35,
                        outline: 'none',
                      },
                      hover: {
                        fill: 'transparent',
                        stroke: '#7dd3fc',
                        strokeWidth: layer === 'estado' ? 1.4 : 0.9,
                        outline: 'none',
                      },
                      pressed: {
                        fill: 'transparent',
                        stroke: '#a5b4fc',
                        outline: 'none',
                      },
                    }}
                  />
                )
              })}

              {geographies
                .filter((geo) => geo.properties?.layer === 'macroregiao')
                .map((geo) => {
                  const centroid = geoCentroid(geo)
                  const projected = projectionMemo(centroid as [number, number])
                  const performance = MACRO_REGIOES_PERFORMANCE.find(
                    (m) => m.id === String(geo.properties?.cod_meso ?? geo.properties?.codarea ?? '')
                  )
                  if (!performance || !projected) return null
                  const [x, y] = projected
                  const labelWidth = 120
                  const labelHeight = 34
                  return (
                    <g key={`label-${geo.rsmKey}`}>
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
                      <text
                        x={x}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={500}
                        fill="#cbd5f5"
                      >
                        {performance.nome}
                      </text>
                      <text
                        x={x}
                        y={y + 9}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={700}
                        fill="#f8fafc"
                      >
                        {performance.mediaEnem} pts
                      </text>
                    </g>
                  )
                })}
            </>
          )}
        </Geographies>
      </ComposableMap>
    </div>
  )
}
