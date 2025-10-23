import React, { useState } from 'react'
import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'

export default function Layout() {
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-screen">
      <TopBar onToggleSidebar={() => setOpen(o => !o)} />
      <div className="grid" style={{ gridTemplateColumns: open ? '240px 1fr' : '1fr' }}>
        {open && (
          <aside className="bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-56px)]">
            <Sidebar />
          </aside>
        )}
        <section className="min-h-[calc(100vh-56px)]">
          <Outlet />
        </section>
      </div>
    </div>
  )
}