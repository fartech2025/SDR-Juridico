import React from 'react'
import { Link } from 'react-router-dom'

export default function LoginDebug() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">🔐 Login ENEM</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Senha:</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full btn btn-primary py-3"
          >
            Entrar
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Não tem conta? <Link to="/cadastro" className="text-blue-400 hover:text-blue-300">Cadastre-se</Link>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-400">← Voltar para Home</Link>
        </div>
      </div>
    </div>
  )
}