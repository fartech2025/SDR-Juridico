import React from 'react'

export default function HomeDebug() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">🎯 Sistema ENEM - Debug</h1>
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">✅ Status do Sistema</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ React App carregando</li>
          <li>✅ Roteamento funcionando</li>
          <li>✅ Tailwind CSS aplicado</li>
          <li>✅ Componentes renderizando</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card p-4">
          <h3 className="font-semibold text-blue-400">Questões</h3>
          <p className="text-2xl font-bold">95</p>
          <p className="text-xs text-slate-400">ENEM 2024</p>
        </div>
        
        <div className="card p-4">
          <h3 className="font-semibold text-green-400">Temas</h3>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs text-slate-400">Classificados</p>
        </div>
        
        <div className="card p-4">
          <h3 className="font-semibold text-purple-400">Imagens</h3>
          <p className="text-2xl font-bold">13</p>
          <p className="text-xs text-slate-400">Processadas</p>
        </div>
      </div>
    </div>
  )
}