import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'

export default function Layout() {
  const [open, setOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar dispositivos móveis
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile && open) {
        setOpen(false) // Fechar sidebar em mobile por padrão
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [open])

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar onToggleSidebar={() => setOpen(o => !o)} />
      
      {/* Layout Desktop */}
      <div className={`
        ${isMobile ? 'relative' : 'grid'} 
        ${!isMobile && open ? 'grid-cols-[240px_1fr]' : 'grid-cols-1'}
        transition-all duration-300 ease-in-out
      `}>
        {/* Sidebar */}
        {open && (
          <>
            {/* Overlay para mobile */}
            {isMobile && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <aside className={`
              ${isMobile 
                ? 'fixed left-0 top-14 z-50 w-64 h-[calc(100vh-56px)] transform translate-x-0' 
                : 'relative'
              }
              bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-56px)]
              transition-transform duration-300 ease-in-out
              ${isMobile && !open ? '-translate-x-full' : 'translate-x-0'}
            `}>
              <Sidebar 
                isOpen={open} 
                onClose={() => setOpen(false)} 
              />
            </aside>
          </>
        )}
        
        {/* Conteúdo Principal */}
        <main className={`
          min-h-[calc(100vh-56px)] 
          ${isMobile ? 'w-full' : 'flex-1'}
          transition-all duration-300 ease-in-out
          overflow-x-hidden
        `}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}