import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, GraduationCap, Trophy } from 'lucide-react'

export default function Sidebar() {
  const { pathname } = useLocation()
  const Item = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link to={to} className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/70 transition-colors ${pathname === to ? 'bg-slate-800/80 text-white' : 'text-slate-300'}`}>
      {children}
    </Link>
  )

  return (
    <div className="h-full p-3 space-y-2">
      <div className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-xs text-slate-300">
        Procurar opção do menu...
      </div>
      <nav className="space-y-1">
        <Item to="/"><Home size={18}/> <span>Home</span></Item>
        <Item to="/provas"><GraduationCap size={18}/> <span>Provas</span></Item>
        <Item to="/ranking"><Trophy size={18}/> <span>Ranking</span></Item>
      </nav>
    </div>
  )
}