import * as React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ListTodo,
  Power,
  Settings,
  SlidersHorizontal,
  Briefcase,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Users,
  Database,
  ShieldCheck,
  Menu,
  X,
  Flame,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useIsFartechAdmin, useIsOrgAdmin } from '@/hooks/usePermissions'
import { usePageTracking } from '@/hooks/usePageTracking'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/utils/cn'
import { auditService, sessionService } from '@/services/auditService'

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const appNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operacao',
    items: [
      { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
      { label: 'Agenda', to: '/app/agenda', icon: CalendarClock },
      { label: 'Tarefas', to: '/app/tarefas', icon: ListTodo },
    ],
  },
  {
    label: 'Relacionamento',
    items: [
      { label: 'Leads', to: '/app/leads', icon: Flame },
      { label: 'Clientes', to: '/app/clientes', icon: UserRound },
      { label: 'Casos', to: '/app/casos', icon: Briefcase },
    ],
  },
  {
    label: 'Conteudo',
    items: [
      { label: 'Documentos', to: '/app/documentos', icon: FileText },
      { label: 'DataJud', to: '/app/datajud', icon: Database },
    ],
  },
  {
    label: 'Governanca',
    items: [
      { label: 'Auditoria', to: '/app/auditoria', icon: ShieldCheck },
      { label: 'Indicadores', to: '/app/indicadores', icon: BarChart3 },
    ],
  },
]

const adminNavItems = [
  { label: 'Organizacoes', to: '/admin/organizations', icon: Building2 },
  { label: 'Usuarios', to: '/admin/users', icon: Users },
  { label: 'Seguranca', to: '/admin/security', icon: ShieldCheck },
]

const orgAdminNavItems = [
  { label: 'Configuracoes Org', to: '/org/settings', icon: Settings },
  { label: 'Usuarios da Org', to: '/org/users', icon: Users },
]

const findActiveGroupLabel = (
  groups: { label: string; items: NavItem[] }[],
  pathname: string,
) => {
  const normalizedPath = pathname.startsWith('/app/caso/')
    ? '/app/casos'
    : pathname
  const group = groups.find((item) =>
    item.items.some((navItem) => normalizedPath.startsWith(navItem.to)),
  )
  return group?.label ?? null
}

export const AppShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const { displayName, shortName, initials } = useCurrentUser()
  const isFartechAdmin = useIsFartechAdmin()
  const isOrgAdmin = useIsOrgAdmin()
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const [sidebarGroupOpen, setSidebarGroupOpen] = React.useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null)

  const profilePath = React.useMemo(() => {
    if (location.pathname.startsWith('/admin')) return '/admin/perfil'
    if (location.pathname.startsWith('/org')) return '/org/perfil'
    return '/app/perfil'
  }, [location.pathname])

  const administrationItems = React.useMemo(() => {
    const items: NavItem[] = [
      { label: 'Configuracoes', to: '/app/config', icon: Settings },
    ]
    if (isOrgAdmin) {
      items.push(...orgAdminNavItems)
    }
    return items
  }, [isOrgAdmin])

  const sidebarGroups = React.useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      return [{ label: 'Administracao', items: adminNavItems }]
    }
    return [
      ...appNavGroups,
      { label: 'Administracao', items: administrationItems },
    ]
  }, [administrationItems, location.pathname])

  const activeGroupLabel = React.useMemo(
    () => findActiveGroupLabel(sidebarGroups, location.pathname),
    [sidebarGroups, location.pathname],
  )

  usePageTracking()

  React.useEffect(() => {
    if (isFartechAdmin && location.pathname.startsWith('/app')) {
      navigate('/admin/organizations', { replace: true })
    }
  }, [isFartechAdmin, location.pathname, navigate])

  React.useEffect(() => {
    if (!profileMenuOpen) return
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && profileMenuRef.current?.contains(target)) return
      setProfileMenuOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [profileMenuOpen])

  React.useEffect(() => {
    setProfileMenuOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    if (activeGroupLabel) {
      setSidebarGroupOpen(activeGroupLabel)
    }
  }, [activeGroupLabel])

  const handleLogout = async () => {
    setLogoutOpen(false)
    await auditService.logLogout()
    sessionService.end()
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleProfileNavigate = () => {
    setProfileMenuOpen(false)
    navigate(profilePath)
  }

  const handleSwitchUser = async () => {
    setProfileMenuOpen(false)
    await auditService.logLogout()
    sessionService.end()
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-gray-200 bg-white lg:flex transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-gray-100 transition-all duration-300",
          sidebarCollapsed ? "px-3 justify-center" : "px-5"
        )}>
          <Logo size="md" collapsed={sidebarCollapsed} />
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto py-4 transition-all duration-300",
          sidebarCollapsed ? "px-2" : "px-3"
        )}>
          {sidebarGroups.map((group, index) => {
            const normalizedPath = location.pathname.startsWith('/app/caso/')
              ? '/app/casos'
              : location.pathname
            const hasActiveItem = group.items.some((item) =>
              normalizedPath.startsWith(item.to),
            )
            const isOpen = sidebarGroupOpen === group.label
            return (
              <div key={group.label} className="space-y-1">
                {index > 0 && <div className="my-4" />}

                {/* Section Title */}
                {!sidebarCollapsed && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                )}
                {sidebarCollapsed && index > 0 && (
                  <div className="mx-2 border-t border-gray-100" />
                )}

                {/* Nav Items */}
                <div className="space-y-1 relative">
                  {group.items.map((item) => {
                    const isActive = normalizedPath.startsWith(item.to)
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                          sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                        style={isActive ? {
                          backgroundColor: 'rgba(114, 16, 17, 0.08)',
                          color: '#721011'
                        } : {}}
                      >
                        <div className="flex-shrink-0" style={isActive ? { color: '#721011' } : {}}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-left">{item.label}</span>
                        )}
                        {isActive && !sidebarCollapsed && (
                          <div
                            className="w-1 h-6 rounded-full absolute left-0"
                            style={{ backgroundColor: '#721011' }}
                          />
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className={cn(
          "border-t border-gray-100 transition-all duration-300",
          sidebarCollapsed ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center",
            sidebarCollapsed ? "justify-center" : "gap-3"
          )}>
            <div
              className={cn(
                "rounded-full flex items-center justify-center text-white font-semibold text-sm",
                sidebarCollapsed ? "w-10 h-10" : "w-10 h-10"
              )}
              style={{ backgroundColor: '#721011' }}
            >
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{shortName}</p>
                <p className="text-xs text-gray-500">Perfil</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl overflow-y-auto">
            {/* Mobile Logo */}
            <div className="h-16 flex items-center border-b border-gray-100 px-5">
              <Logo size="md" />
            </div>

            {/* Mobile Navigation */}
            <nav className="py-4 px-3">
              {sidebarGroups.map((group, index) => {
                const normalizedPath = location.pathname.startsWith('/app/caso/')
                  ? '/app/casos'
                  : location.pathname
                const isOpen = sidebarGroupOpen === group.label
                return (
                  <div key={group.label} className="space-y-1">
                    {index > 0 && <div className="my-4" />}

                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {group.label}
                    </div>

                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = normalizedPath.startsWith(item.to)
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'text-gray-900'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                            style={isActive ? {
                              backgroundColor: 'rgba(114, 16, 17, 0.08)',
                              color: '#721011'
                            } : {}}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={cn(
          "h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Greeting */}
          <div className="hidden lg:block">
            <span className="text-gray-400 text-sm">Bom dia,</span>
            <span className="text-gray-900 font-semibold ml-1">{displayName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                '--tw-ring-color': '#721011',
                boxShadow: 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)'
              } as React.CSSProperties}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#721011' }}
            />
          </button>

          {/* Settings */}
          <button
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
            onClick={() => navigate('/app/config')}
          >
            <Settings className="h-5 w-5" />
            <span className="hidden md:inline">Preferências</span>
          </button>

          {/* Profile Menu */}
          <div className="relative hidden sm:flex" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: '#721011' }}
              >
                {initials}
              </div>
              <span>{shortName}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-gray-400 transition', profileMenuOpen && 'rotate-180')}
              />
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  onClick={handleProfileNavigate}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  Acessar perfil
                </button>
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  Trocar usuario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setLogoutOpen(true)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-red-50"
                  style={{ color: '#dc2626' }}
                  role="menuitem"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Outlet />
      </main>

      {/* Logout Modal */}
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
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' }}
          >
            <Power className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Deseja sair do sistema?
          </h3>
          <p className="text-sm text-gray-500">
            Sua sessao sera encerrada com seguranca.
          </p>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        input:focus {
          --tw-ring-color: #721011;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #BDBDBD;
        }
      `}</style>
    </div>
  )
}
