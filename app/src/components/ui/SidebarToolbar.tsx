import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CalendarIcon, BookOpenIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Prova, Tema } from '@/types';

interface SidebarToolbarProps {
  provas: Prova[];
  temas: Tema[];
  provaSelecionada: string;
  temaSelecionado: string;
  onProvaChange: (provaId: string) => void;
  onTemaChange: (temaId: string) => void;
  aproveitamentoPorTema?: AproveitamentoTema[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function SidebarToolbar({
  provas,
  temas,
  provaSelecionada,
  temaSelecionado,
  onProvaChange,
  onTemaChange,
  aproveitamentoPorTema = [],
  isCollapsed = false,
  onToggleCollapse
}: SidebarToolbarProps) {
  const [expandedSections, setExpandedSections] = useState({
    provas: true,
    temas: true,
    stats: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dados demo para o gráfico se não houver dados reais
  const chartData = (aproveitamentoPorTema.length > 0
    ? aproveitamentoPorTema.map((item) => ({
        nome: item.nome ?? item.nome_tema ?? 'Sem tema',
        percentual: typeof item.percentual === 'number' ? item.percentual : Number(item.percentual ?? 0),
      }))
    : [
        { nome: 'Literatura', percentual: 85 },
        { nome: 'Gramática', percentual: 72 },
        { nome: 'Interpretação', percentual: 68 },
        { nome: 'Redação', percentual: 45 },
      ]);

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-red-500 flex flex-col items-center py-4 space-y-4 border-r border-slate-700">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        
        <div className="space-y-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <BookOpenIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <ChartBarIcon className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-green-500 flex flex-col border-r border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Painel de Controle
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg sidebar-button"
          >
            <ChevronDownIcon className="w-4 h-4 transform rotate-90" />
          </button>
        </div>
        <p className="text-sm text-slate-400">Selecione provas, temas e visualize seu progresso</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Seleção de Provas */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('provas')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-semibold text-slate-200">Provas por Ano</span>
            </div>
            {expandedSections.provas ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.provas && (
            <div className="ml-11 space-y-2">
              <select
                value={provaSelecionada}
                onChange={(e) => onProvaChange(e.target.value)}
                className="w-full select-field"
              >
                <option value="">Todas as provas</option>
                {provas.map((prova) => (
                  <option key={prova.id_prova} value={prova.id_prova.toString()}>
                    {prova.ano} - {prova.descricao}
                  </option>
                ))}
              </select>
              
              {provas.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {Array.from(new Set(provas.map(p => p.ano))).sort((a, b) => b - a).slice(0, 4).map((ano) => (
                    <button
                      key={ano}
                      onClick={() => {
                        const prova = provas.find(p => p.ano === ano);
                        if (prova) onProvaChange(prova.id_prova.toString());
                      }}
                      className={`sidebar-button p-2 rounded-lg text-sm font-medium ${
                        provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada)
                          ? 'active'
                          : ''
                      }`}
                    >
                      {ano}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seleção de Temas */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('temas')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <BookOpenIcon className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-semibold text-slate-200">Temas</span>
            </div>
            {expandedSections.temas ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.temas && (
            <div className="ml-11 space-y-2">
              <select
                value={temaSelecionado}
                onChange={(e) => onTemaChange(e.target.value)}
                className="w-full select-field"
              >
                <option value="">Todos os temas</option>
                {temas.map((tema) => (
                  <option key={tema.id_tema} value={tema.id_tema.toString()}>
                    {tema.nome_tema}
                  </option>
                ))}
              </select>

              {temas.length > 0 && (
                <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
                  {temas.slice(0, 6).map((tema) => (
                    <button
                      key={tema.id_tema}
                      onClick={() => onTemaChange(tema.id_tema.toString())}
                      className={`sidebar-button w-full p-2 rounded-lg text-sm text-left ${
                        tema.id_tema.toString() === temaSelecionado
                          ? 'active'
                          : ''
                      }`}
                    >
                      {tema.nome_tema}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gráfico de Aproveitamento */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('stats')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <ChartBarIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-semibold text-slate-200">Aproveitamento</span>
            </div>
            {expandedSections.stats ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.stats && (
            <div className="ml-11">
              <div className="chart-container p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Performance por Tema</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="nome" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar 
                        dataKey="percentual" 
                        fill="url(#gradientBar)"
                        radius={[2, 2, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Resumo rápido */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-emerald-400 font-semibold">
                        {chartData.length > 0 ? Math.max(...chartData.map(d => d.percentual)) : 0}%
                      </div>
                      <div className="text-slate-500">Melhor</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 font-semibold">
                        {chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.percentual, 0) / chartData.length) : 0}%
                      </div>
                      <div className="text-slate-500">Média</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">
          📊 Dados atualizados em tempo real
        </div>
      </div>
    </div>
  );
}