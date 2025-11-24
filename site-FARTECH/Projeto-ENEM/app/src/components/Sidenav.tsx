import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidenavProps {
  isOpen?: boolean;
}

export default function Sidenav({ isOpen = true }: SidenavProps) {
  const [collapsed, setCollapsed] = useState(!isOpen);
  const location = useLocation();

  const menuItems = [
    { icon: '🏠', label: 'Início', path: '/home' },
    { icon: '🎯', label: 'Central do Aluno', path: '/inicio' },
    { icon: '🎒', label: 'Painel do Aluno', path: '/painel-aluno' },
    { icon: '', label: 'Estatísticas', path: '/estatisticas' },
    { icon: '🏆', label: 'Ranking', path: '/ranking' },
    { icon: '📚', label: 'Questões', path: '/database-inspetor' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 overflow-y-auto flex-shrink-0 ${
        collapsed ? 'w-16 sm:w-20' : 'w-64 sm:w-72 md:w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-base md:text-lg font-bold text-blue-400 truncate leading-tight">
              ENEM - Estudos
            </h2>
            <p className="text-[10px] md:text-xs text-gray-500 truncate leading-tight">
              Plataforma Educacional
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200 flex-shrink-0"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-2 md:p-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 p-2.5 md:p-3 rounded-lg transition-all group ${
              isActive(item.path)
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-lg md:text-xl flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-xs md:text-sm font-medium truncate">{item.label}</span>
            )}
            {isActive(item.path) && !collapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="text-[10px] md:text-xs text-gray-500 text-center">
            <p>Sistema ENEM</p>
            <p className="mt-1">Transformando Educação</p>
          </div>
        </div>
      )}
    </div>
  );
}
