import React from 'react'
import { Prova, Tema } from '@/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

type AproveitamentoTema = {
  nome_tema?: string | null;
  percentual?: number | null;
};

interface ChatGPTStyleSidebarProps {
  provas: Prova[]
  temas: Tema[]
  provaSelecionada: string
  temaSelecionado: string
  onProvaChange: (prova: string) => void
  onTemaChange: (tema: string) => void
  aproveitamentoPorTema: AproveitamentoTema[]
}

export default function ChatGPTStyleSidebar({
  provas,
  temas,
  provaSelecionada,
  temaSelecionado,
  onProvaChange,
  onTemaChange,
  aproveitamentoPorTema
}: ChatGPTStyleSidebarProps) {
  const chartData = aproveitamentoPorTema.map(item => ({
    nome: item.nome_tema?.substring(0, 10) + '...' || 'Sem tema',
    percentual: Math.round(item.percentual || 0)
  }))

  const anosDisponiveis = [...new Set(provas.map(p => p.ano))].sort((a, b) => b - a)

  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      backgroundColor: '#171717',
      borderRight: '1px solid #2d2d2d',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Header da Sidebar */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2d2d2d',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#10b981',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            📚
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              ENEM Dashboard
            </h2>
          </div>
        </div>
      </div>

      {/* Botão Novo Chat (Inspirado no ChatGPT) */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2d2d2d' }}>
        <button style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2d2d2d',
          border: '1px solid #404040',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#404040'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2d2d2d'
        }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          Nova Análise
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0'
      }}>
        {/* Seção de Anos */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d2d'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px' }}>📅</span>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e5e5'
            }}>
              Provas por Ano
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {anosDisponiveis.map((ano) => (
              <button
                key={ano}
                onClick={() => {
                  const prova = provas.find(p => p.ano === ano);
                  if (prova) onProvaChange(prova.id_prova.toString());
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #404040',
                  backgroundColor: provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada) 
                    ? '#10b981' : '#2d2d2d',
                  color: provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada) 
                    ? '#ffffff' : '#e5e5e5',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada)) {
                    e.currentTarget.style.backgroundColor = '#404040'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!provas.find(p => p.ano === ano && p.id_prova.toString() === provaSelecionada)) {
                    e.currentTarget.style.backgroundColor = '#2d2d2d'
                  }
                }}
              >
                {ano}
              </button>
            ))}
          </div>
        </div>

        {/* Seção de Temas */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d2d'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px' }}>🏷️</span>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e5e5'
            }}>
              Temas de Estudo
            </h3>
          </div>

          <div style={{
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {temas.slice(0, 8).map((tema) => (
              <button
                key={tema.id_tema}
                onClick={() => onTemaChange(tema.id_tema.toString())}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: tema.id_tema.toString() === temaSelecionado 
                    ? '#10b981' : 'transparent',
                  color: tema.id_tema.toString() === temaSelecionado 
                    ? '#ffffff' : '#d4d4d4',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (tema.id_tema.toString() !== temaSelecionado) {
                    e.currentTarget.style.backgroundColor = '#2d2d2d'
                  }
                }}
                onMouseLeave={(e) => {
                  if (tema.id_tema.toString() !== temaSelecionado) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {tema.nome_tema}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico de Performance */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d2d'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px' }}>📊</span>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              color: '#e5e5e5'
            }}>
              Performance
            </h3>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #2d2d2d'
          }}>
            <div style={{ height: '120px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#e5e7eb'
                    }}
                  />
                  <Bar 
                    dataKey="percentual" 
                    fill="#10b981" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Estatísticas Resumidas */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #2d2d2d',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  color: '#10b981', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {chartData.length > 0 ? Math.max(...chartData.map(d => d.percentual)) : 0}%
                </div>
                <div style={{ color: '#9ca3af' }}>Melhor</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  color: '#f59e0b', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.percentual, 0) / chartData.length) : 0}%
                </div>
                <div style={{ color: '#9ca3af' }}>Média</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #2d2d2d',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <span>⚡</span>
          <span>Dados em tempo real</span>
        </div>
      </div>
    </aside>
  )
}