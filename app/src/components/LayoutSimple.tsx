import React from 'react'
import { Outlet } from 'react-router-dom'

export default function LayoutSimple() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 p-4">
        <h1 className="text-xl font-bold text-blue-400">ENEM 2024</h1>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}