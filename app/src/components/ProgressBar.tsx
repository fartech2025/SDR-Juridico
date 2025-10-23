import React from 'react'
export default function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className="progress">
      <span style={{ width: pct + '%' }} />
    </div>
  )
}