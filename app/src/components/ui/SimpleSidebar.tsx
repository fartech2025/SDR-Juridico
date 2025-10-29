import React from 'react';

interface SimpleSidebarProps {
  provas: any[];
  temas: any[];
  provaSelecionada: string;
  temaSelecionado: string;
  onProvaChange: (provaId: string) => void;
  onTemaChange: (temaId: string) => void;
}

export default function SimpleSidebar({
  provas,
  temas,
  provaSelecionada,
  temaSelecionado,
  onProvaChange,
  onTemaChange
}: SimpleSidebarProps) {
  return (
    <div 
      style={{
        width: '300px',
        height: '100vh',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #475569',
        padding: '20px',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000
      }}
    >
      <h2 style={{ marginBottom: '20px', color: '#60a5fa' }}>🎯 Painel de Controle</h2>
      
      {/* Seleção de Provas */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: '#e2e8f0' }}>📅 Ano da Prova</h3>
        <select
          value={provaSelecionada}
          onChange={(e) => onProvaChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#374151',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            color: 'white'
          }}
        >
          <option value="">Todas as provas</option>
          {provas.map((prova) => (
            <option key={prova.id_prova} value={prova.id_prova.toString()}>
              {prova.ano} - {prova.descricao}
            </option>
          ))}
        </select>
      </div>

      {/* Seleção de Temas */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '10px', color: '#e2e8f0' }}>🏷️ Tema</h3>
        <select
          value={temaSelecionado}
          onChange={(e) => onTemaChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#374151',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            color: 'white'
          }}
        >
          <option value="">Todos os temas</option>
          {temas.map((tema) => (
            <option key={tema.id_tema} value={tema.id_tema.toString()}>
              {tema.nome_tema}
            </option>
          ))}
        </select>
      </div>

      {/* Gráfico Placeholder */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px', color: '#e2e8f0' }}>📊 Aproveitamento</h3>
        <div 
          style={{
            backgroundColor: '#374151',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <p>Gráfico de barras aqui</p>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Literatura: 85%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gramática: 72%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
        📊 Dados atualizados em tempo real
      </div>
    </div>
  );
}