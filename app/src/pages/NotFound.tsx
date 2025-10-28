import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-max py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-slate-300">O recurso solicitado não existe.</p>
      <Link to="/" className="btn">Voltar para Home</Link>
    </div>
  )
}