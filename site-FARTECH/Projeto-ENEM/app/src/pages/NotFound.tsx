import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-purple-500/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
      
      <div className="relative glass-card p-12 max-w-md text-center hover-lift">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-pulse-glow">🚫</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-4">Página não encontrada</h2>
          <p className="text-slate-300 text-lg">
            Oops! O recurso que você está procurando não existe ou foi movido.
          </p>
        </div>

        {/* Action Button */}
        <Link 
          to="/" 
          className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
        >
          <span className="relative z-10">🏠 Sair</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>

        {/* Additional Info */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <p className="text-slate-400 text-sm">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  )
}
