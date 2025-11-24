import React from 'react'
import { Menu, User, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="h-14 sticky top-0 z-30 border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center gap-3">
        {/* Menu Button */}
        <button 
          aria-label="Abrir/fechar menu" 
          onClick={onToggleSidebar} 
          className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <Menu size={18} className="text-white" />
        </button>
        
        {/* Logo */}
        <Link 
          to="/" 
          className="font-black text-lg sm:text-xl text-white hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:via-purple-400 hover:to-cyan-400 hover:bg-clip-text transition-all duration-300 flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Trophy size={20} className="text-white" />
          </div>
          <span className="hidden xs:inline">ENEM</span>
          <span className="hidden sm:inline font-light text-slate-300">2024</span>
        </Link>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* User Info - Responsivo */}
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-medium text-slate-300">
              Modo Público
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
          <span className="text-xs sm:text-sm md:hidden font-medium">
            Público
          </span>
        </div>
      </div>
    </header>
  )
}