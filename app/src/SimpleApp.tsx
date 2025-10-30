import React from 'react';

export default function SimpleApp() {
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#0f172a', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🎯 ENEM App - Teste Simples</h1>
      <p>✅ React funcionando</p>
      <p>✅ Componente renderizando</p>
      <p>✅ Servidor ativo</p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#1e293b',
        borderRadius: '8px'
      }}>
        <h2>Status do Sistema:</h2>
        <ul>
          <li>React App: ✅ OK</li>
          <li>Vite Server: ✅ OK</li>
          <li>Port 5175: ✅ OK</li>
        </ul>
      </div>
    </div>
  );
}