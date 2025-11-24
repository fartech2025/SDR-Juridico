import React from 'react';
import type { Prova, Tema } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type AproveitamentoTema = {
  nome?: string | null;
  nome_tema?: string | null;
  percentual?: number | null;
};

interface SidebarProps {
  provas: Prova[];
  temas: Tema[];
  provaSelecionada: string;
  temaSelecionado: string;
  onProvaChange: (provaId: string) => void;
  onTemaChange: (temaId: string) => void;
  aproveitamentoPorTema?: AproveitamentoTema[];
}

export default function Sidebar({
  provas,
  temas,
  provaSelecionada,
  temaSelecionado,
  onProvaChange,
  onTemaChange,
  aproveitamentoPorTema = []
}: SidebarProps) {
  // Dados demo para o gráfico se não houver dados reais
  const chartData: { nome: string; percentual: number }[] = aproveitamentoPorTema.length > 0
    ? aproveitamentoPorTema.map((item) => ({
        nome: item.nome ?? item.nome_tema ?? 'Sem tema',
        percentual: typeof item.percentual === 'number' ? item.percentual : Number(item.percentual ?? 0),
      }))
    : [
    { nome: 'Literatura', percentual: 85 },
    { nome: 'Gramática', percentual: 72 },
    { nome: 'Interpretação', percentual: 68 },
    { nome: 'Redação', percentual: 45 }
  ];

  return (
    <aside 
      style={{
        width: '320px',
        height: 'calc(100vh - 80px)', // Altura total menos o header
        backgroundColor: '#1e293b',
        borderRight: '1px solid #475569',
        padding: '20px',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: '80px', // Posição abaixo do header
        zIndex: 40,
        overflowY: 'auto',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header da Sidebar Persistente */}
      <div style={{ 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #475569'
      }}>
        <h2 style={{ 
          margin: 0, 
          background: 'linear-gradient(to right, #60a5fa, #a855f7)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          fontSize: '20px', 
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          🎯 Painel de Controle
        </h2>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: '#9ca3af',
          lineHeight: '1.4'
        }}>
          Selecione provas, temas e visualize seu progresso em tempo real
        </p>
      </div>
      
      {/* Seleção de Provas */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '18px',
          padding: '12px',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <div style={{ 
            padding: '10px', 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
          }}>
            <span style={{ fontSize: '18px' }}>📅</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: '700', fontSize: '16px' }}>Provas por Ano</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Selecione o ano da prova</p>
          </div>
        </div>
        
        <select
          value={provaSelecionada}
          onChange={(e) => onProvaChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#374151',
            border: '1px solid #6b7280',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            marginBottom: '15px'
          }}
        >
          <option value="">Todas as provas</option>
          {provas.map((prova) => (
            <option key={prova.id_prova} value={prova.id_prova.toString()}>
              {prova.ano} - {prova.descricao}
            </option>
          ))}
        </select>

        {/* Botões rápidos por ano */}
        {provas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Array.from(new Set(provas.map(p => p.ano))).sort((a, b) => b - a).slice(0, 4).map((ano) => (
              <button
                key={ano}
                onClick={() => {
                  const prova = provas.find(p => p.ano === ano);
                  if (prova) onProvaChange(prova.id_prova.toString());
                }}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #6b7280',
                  backgroundColor: provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada) ? '#1e40af' : '#374151',
                  color: provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada) ? '#bfdbfe' : '#d1d5db',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {ano}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seleção de Temas */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '18px',
          padding: '12px',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <div style={{ 
            padding: '10px', 
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}>
            <span style={{ fontSize: '18px' }}>🏷️</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: '700', fontSize: '16px' }}>Temas</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Filtre por tema específico</p>
          </div>
        </div>
        
        <select
          value={temaSelecionado}
          onChange={(e) => onTemaChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#374151',
            border: '1px solid #6b7280',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            marginBottom: '15px'
          }}
        >
          <option value="">Todos os temas</option>
          {temas.map((tema) => (
            <option key={tema.id_tema} value={tema.id_tema.toString()}>
              {tema.nome_tema}
            </option>
          ))}
        </select>

        {/* Botões de temas */}
        {temas.length > 0 && (
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {temas.slice(0, 6).map((tema) => (
              <button
                key={tema.id_tema}
                onClick={() => onTemaChange(tema.id_tema.toString())}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  border: '1px solid #6b7280',
                  backgroundColor: tema.id_tema.toString() === temaSelecionado ? '#7c3aed' : '#374151',
                  color: tema.id_tema.toString() === temaSelecionado ? '#c4b5fd' : '#d1d5db',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                {tema.nome_tema}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico de Aproveitamento */}
      <div style={{ 
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '20px',
          padding: '12px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '12px',
          border: '1px solid #475569'
        }}>
          <div style={{ 
            padding: '10px', 
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}>
            <span style={{ fontSize: '18px' }}>📊</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: '700', fontSize: '16px' }}>Aproveitamento por Tema</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Performance detalhada</p>
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '1px solid #475569',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}>
          <h4 style={{ 
            margin: '0 0 18px 0', 
            fontSize: '14px', 
            color: '#e2e8f0', 
            fontWeight: '600',
            textAlign: 'center' 
          }}>Performance por Tema</h4>
          
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.3} />
                <XAxis 
                  dataKey="nome" 
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  axisLine={{ stroke: '#6b7280' }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  domain={[0, 100]}
                  axisLine={{ stroke: '#6b7280' }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e5e7eb',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Bar 
                  dataKey="percentual" 
                  fill="url(#barGradient)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Resumo */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '1px solid #475569',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div style={{ 
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              <div style={{ 
                color: '#10b981', 
                fontWeight: '700',
                fontSize: '16px',
                marginBottom: '4px'
              }}>
                {chartData.length > 0 ? Math.max(...chartData.map(d => d.percentual)) : 0}%
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Melhor Performance</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              <div style={{ 
                color: '#fbbf24', 
                fontWeight: '700',
                fontSize: '16px',
                marginBottom: '4px'
              }}>
                {chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.percentual, 0) / chartData.length) : 0}%
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>Média Geral</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        paddingTop: '24px',
        borderTop: '1px solid #334155',
        textAlign: 'center',
        fontSize: '12px',
        color: '#94a3b8',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #334155'
      }}>
        <div style={{ marginBottom: '8px' }}>📊 Dados atualizados em tempo real</div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>Sistema BancoEnem v2.0</div>
      </div>
    </aside>
  );
}