import React from 'react'
import ProgressBar from './ProgressBar'
import { ProvaItem } from '@/types'
import { useNavigate } from 'react-router-dom'

export default function ProvaCard({ item }: { item: ProvaItem }) {
  const navigate = useNavigate()
  const percent = item.totalQuestoes ? Math.round((item.respondidas / item.totalQuestoes) * 100) : 0
  const hasProgress = item.respondidas > 0 && item.respondidas < item.totalQuestoes
  const btnLabel = hasProgress ? 'Retomar' : 'Iniciar'

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 grid place-items-center text-2xl">🎓</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-blue-400">ENEM {item.ano}</h3>
          <p className="text-sm text-slate-300">{item.totalQuestoes} questões — {percent}% concluídas</p>
        </div>
      </div>
      <ProgressBar value={item.respondidas} max={item.totalQuestoes || 1} />
      <div className="flex items-center gap-3">
        <button className="btn" onClick={() => navigate(`/provas/${item.ano}`)}>{btnLabel}</button>
      </div>
    </div>
  )
}