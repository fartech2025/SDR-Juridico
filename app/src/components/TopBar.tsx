import React from 'react'
import { Menu, User, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="h-14 sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center gap-3">
        {/* Menu Button */}
        <button 
          aria-label="Abrir/fechar menu" 
          onClick={onToggleSidebar} 
          className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:bg-slate-700/70 transition-colors"
        >
          <Menu size={18} />
        </button>
        
        {/* Logo */}
        <Link 
          to="/" 
          className="font-bold text-lg sm:text-xl text-white hover:text-blue-400 transition-colors flex items-center gap-2"
        >
          <Trophy size={20} className="text-blue-400" />
          <span className="hidden xs:inline">ENEM</span>
          <span className="hidden sm:inline">2024</span>
        </Link>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* User Info - Responsivo */}
        <div className="flex items-center gap-2 text-slate-300">
          <User size={16} className="hidden sm:block" />
          <span className="text-xs sm:text-sm hidden md:block">
            Modo Público
          </span>
          <span className="text-xs sm:text-sm md:hidden">
            Público
          </span>
        </div>
      </div>
    </header>
  )
}