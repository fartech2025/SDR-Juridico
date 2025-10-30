import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🎯 ENEM App</h1>
        <p className="text-lg text-slate-400">Aplicação carregada com sucesso!</p>
        <div className="mt-8 space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">✅ Status do Sistema</h2>
            <p>React + TypeScript + Vite funcionando</p>
          </div>
          <div className="bg-blue-600 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🚀 Próximos Passos</h2>
            <p>Sistema pronto para desenvolvimento</p>
          </div>
        </div>
      </div>
    </div>
  );
}