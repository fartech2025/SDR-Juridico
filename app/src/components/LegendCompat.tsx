import React from 'react'
import { Legend as RechartsLegend } from 'recharts'

export default function LegendCompat(props: any) {
  return React.createElement(RechartsLegend as unknown as React.ComponentType<any>, props)
}

