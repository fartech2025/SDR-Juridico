import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, GraduationCap, Trophy, BarChart3, User, Settings, LucideIcon } from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
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
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
        ${pathname === to 
          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
        }
      `}
    >
      <Icon 
        size={18} 
        className={`
          transition-colors duration-200 flex-shrink-0
          ${pathname === to ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}
        `} 
      />
      <span className="text-sm font-medium min-w-0 flex-1">{children}</span>
      {badge && (
        <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
          {badge}
        </span>
      )}
    </Link>
  )

  return (
    <div className="h-full p-3 space-y-4 flex flex-col">
      {/* Search/Filter */}
      <div className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2.5 flex-shrink-0">
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none"
        />
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
          Principal
        </div>
        <Item to="/" icon={Home}>Dashboard</Item>
        <Item to="/provas" icon={GraduationCap} badge="95">Provas</Item>
        <Item to="/ranking" icon={Trophy}>Ranking</Item>
        <Item to="/estatisticas" icon={BarChart3}>Estatísticas</Item>
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-6">
          Estudante
        </div>
        <Item to="/aluno" icon={User}>Área do Aluno</Item>
        <Item to="/aluno/selecionar-prova" icon={Settings}>Configurações</Item>
      </nav>
      
      {/* Status */}
      <div className="pt-4 border-t border-slate-800 flex-shrink-0">
        <div className="text-xs text-slate-500 px-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="min-w-0">Sistema Online</span>
          </div>
          <div className="mt-1 text-slate-600">
            95 questões disponíveis
          </div>
        </div>
      </div>
    </div>
  )
}