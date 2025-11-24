import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Toolbar() {
  const { pathname } = useLocation()
  const isActive = (p: string) => (pathname === p ? 'text-white' : 'text-slate-300 hover:text-white')
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="container-max py-3 flex items-center gap-3">
        <Link to="/" className="font-semibold text-lg">ENEM</Link>
        <nav className="ml-auto flex items-center gap-6 text-sm">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/provas" className={isActive('/provas')}>Provas</Link>
          <Link to="/ranking" className={isActive('/ranking')}>Ranking</Link>
        </nav>
      </div>
    </header>
  )
}