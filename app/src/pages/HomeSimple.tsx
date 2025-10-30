import React from 'react'

export default function HomeSimple() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🎓 ENEM 2024 Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">📊 Estatísticas</h2>
            <p className="text-slate-300">Visualize seu desempenho</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">📝 Provas</h2>
            <p className="text-slate-300">Acesse as provas do ENEM</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">🏆 Ranking</h2>
            <p className="text-slate-300">Veja sua posição</p>
          </div>
        </div>
      </div>
    </div>
  )
}