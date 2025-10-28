import React from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="h-14 sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="container-max h-full flex items-center gap-3">
        <button aria-label="Abrir/fechar menu" onClick={onToggleSidebar} className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:bg-slate-700/70">
          <Menu size={18} />
        </button>
        <Link to="/" className="font-semibold">ENEM</Link>
        <div className="ml-auto text-xs text-slate-300">usuario@email.com</div>
      </div>
    </header>
  )
}