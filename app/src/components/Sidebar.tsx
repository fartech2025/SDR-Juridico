import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, GraduationCap, Trophy, BarChart3, User, Settings, LucideIcon } from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: _isOpen = true, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  
  const Item = ({ to, icon: Icon, children, badge }: { 
    to: string; 
    icon: LucideIcon; 
    children: React.ReactNode;
    badge?: string;
  }) => (
    <Link 
      to={to} 
      onClick={onClose}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-105 shadow-lg
        ${pathname === to 
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 backdrop-blur-sm shadow-xl' 
          : 'text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/20'
        }
      `}
    >
      <div className={`
        p-1.5 rounded-lg transition-all duration-300
        ${pathname === to 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
          : 'bg-white/10 group-hover:bg-white/20'
        }
      `}>
        <Icon 
          size={16} 
          className="text-white flex-shrink-0" 
        />
      </div>
      <span className="text-sm font-medium min-w-0 flex-1">{children}</span>
      {badge && (
        <span className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 shadow-lg">
          {badge}
        </span>
      )}
    </Link>
  )

  return (
    <div className="h-full p-4 space-y-6 flex flex-col">
      {/* Search/Filter */}
      <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 flex-shrink-0 shadow-lg">
        <input 
          type="text" 
          placeholder="🔍 Buscar..." 
          className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
        />
      </div>
      
      {/* Navigation */}
      <nav className="space-y-2 flex-1 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-3 flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          Principal
        </div>
        <Item to="/" icon={Home}>Dashboard</Item>
        <Item to="/provas" icon={GraduationCap} badge="95">Provas</Item>
        <Item to="/ranking" icon={Trophy}>Ranking</Item>
        <Item to="/estatisticas" icon={BarChart3}>Estatísticas</Item>
        
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-3 mt-6 flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
          Estudante
        </div>
        <Item to="/aluno" icon={User}>Área do Aluno</Item>
        <Item to="/aluno/opcoes" icon={Settings}>Configurações</Item>
      </nav>
      
      {/* Status */}
      <div className="pt-4 border-t border-white/10 flex-shrink-0">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-xl p-4 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse flex-shrink-0 shadow-lg"></div>
            <span className="text-sm font-medium text-white">Sistema Online</span>
          </div>
          <div className="text-xs text-emerald-300 flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>95 questões disponíveis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
