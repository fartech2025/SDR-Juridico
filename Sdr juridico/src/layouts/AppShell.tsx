import * as React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Power,
  Scale,
  Settings,
  SlidersHorizontal,
  Briefcase,
  Search,
  ChevronDown,
  UserRound,
  Users,
  Menu,
  X,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { FontSizeButton } from '@/components/FontSizeControl'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Leads', to: '/app/leads', icon: Users },
  { label: 'Clientes', to: '/app/clientes', icon: UserRound },
  { label: 'Casos', to: '/app/casos', icon: Briefcase },
  { label: 'Agenda', to: '/app/agenda', icon: CalendarClock },
  { label: 'Documentos', to: '/app/documentos', icon: FileText },
  { label: 'Indicadores', to: '/app/indicadores', icon: BarChart3 },
  { label: 'Configuracoes', to: '/app/config', icon: Settings },
]

export const AppShell = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { displayName, shortName, initials, roleLabel, orgName } = useCurrentUser()
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    setLogoutOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen text-text">
      {/* Sidebar - Responsivo */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-border bg-linear-to-b from-[#f7f8fc] via-[#f7f8fc] to-[#eef2fb] shadow-soft lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff6aa2] via-[#ff8fb1] to-[#6aa8ff] text-white shadow-soft">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-text-subtle">
              SDR
            </p>
            <p className="text-sm font-semibold text-text">Juridico Online</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[#E9EEFF] text-primary'
                    : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive
                        ? 'text-primary'
                        : 'text-text-subtle group-hover:text-primary',
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 px-4 pb-6">
          <div className="rounded-2xl border border-border bg-white px-4 py-4 text-xs text-text-muted shadow-soft">
            <p className="font-semibold text-text">Assistente juridico</p>
            <p className="mt-1">Automacoes e triagens em tempo real.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 shadow-soft">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-text">{displayName}</p>
              <p className="text-text-subtle">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-16 w-64 max-h-[calc(100vh-64px)] flex-col overflow-y-auto border-r border-border bg-white shadow-soft">
            <nav className="space-y-2 p-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-[#E9EEFF] text-primary'
                        : 'text-text-muted hover:bg-[#F2F5FF] hover:text-text',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-primary'
                            : 'text-text-subtle group-hover:text-primary',
                        )}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Header - Responsivo */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-white/90 px-4 shadow-soft backdrop-blur lg:left-60 lg:px-8">
        {/* Logo/Menu Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop greeting */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div>
            <p className="text-xs text-text-subtle">Bom dia, {displayName}</p>
            <p className="text-sm font-semibold text-text">{orgName}</p>
          </div>
        </div>

        {/* Right actions - Responsivo */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative hidden items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-text-muted shadow-soft md:flex">
            <Search className="h-4 w-4 text-text-subtle" />
            <input
              placeholder="Pesquisar..."
              className="w-44 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            />
            <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary shadow-soft">
              3
            </span>
          </div>

          {/* Controle de Tamanho de Fonte */}
          <FontSizeButton />

          {/* Theme Toggle */}
          <ThemeToggle />

          <Button variant="ghost" size="sm" className="relative rounded-full">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full hidden sm:inline-flex"
            onClick={() => navigate('/app/config')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Preferencias</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hidden sm:inline-flex"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Sair</span>
          </Button>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs text-text shadow-soft sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {initials}
            </div>
            <span>{shortName}</span>
            <ChevronDown className="h-3 w-3 text-text-subtle" />
          </div>
        </div>
      </header>

      <main className="relative min-h-screen bg-transparent pt-16 lg:pl-60">
        <div className="px-4 py-6 md:px-8">
          <Outlet />
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 opacity-10 dark:opacity-10 md:bottom-6 md:right-6">
          <img
            src="https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png"
            alt="Talent SDR Juridico"
            className="w-32 max-w-[50vw] md:w-40 dark:brightness-110"
            loading="lazy"
          />
        </div>
      </main>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        className="max-w-md text-center"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleLogout}>
              Sair
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
            <Power className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-text">
            Deseja sair do sistema?
          </h3>
          <p className="text-xs text-text-muted">
            Sua sessao sera encerrada com seguranca.
          </p>
        </div>
      </Modal>
    </div>
  )
}
