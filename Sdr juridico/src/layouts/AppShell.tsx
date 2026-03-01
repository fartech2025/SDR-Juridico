import * as React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Clock,
  Database,
  FileText,
  LayoutDashboard,
  ListTodo,
  Power,
  Settings,
  Briefcase,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Users,
  Newspaper,
  ShieldCheck,
  Menu,
  X,
  Flame,
  CircleDollarSign,
  LayoutTemplate,
  HelpCircle,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useIsFartechAdmin, useIsOrgAdmin } from '@/hooks/usePermissions'
import { useAlertas } from '@/hooks/useAlertas'
import { useApiHealth } from '@/hooks/useApiHealth'
import { usePageTracking } from '@/hooks/usePageTracking'
import { usePlan } from '@/hooks/usePlan'
import { useOrganizationContext } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/utils/cn'
import { logLogout } from '@/services/auditLogService'
import { supabase } from '@/lib/supabaseClient'
import { resolveOrgScope } from '@/services/orgScope'
import { WhatsNewModal } from '@/components/WhatsNewModal'
import { TourModal, hasTour } from '@/components/TourModal'
import { OrgActiveGuard } from '@/components/guards/OrgActiveGuard'
import { APP_VERSION } from '@/lib/version'

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNavItems = [
  { label: 'Organizacoes', to: '/admin/organizations', icon: Building2 },
  { label: 'Usuarios', to: '/admin/users', icon: Users },
  { label: 'Seguranca', to: '/admin/security', icon: ShieldCheck },
  { label: 'Relatorio Seguranca', to: '/admin/security/report', icon: FileText },
]

const orgAdminNavItems = [
  { label: 'Configuracoes Org', to: '/org/settings', icon: Settings },
  { label: 'Usuarios da Org', to: '/org/users', icon: Users },
]

export const AppShell = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const { displayName, shortName, initials } = useCurrentUser()
  const isFartechAdmin = useIsFartechAdmin()
  const isOrgAdmin = useIsOrgAdmin()
  const { canUseFinanceiro, canUseAnalytics, canUseAuditoria, canUseDOU, canUseTimesheet, canUseTemplates } = usePlan()
  const apiHealth = useApiHealth()
  const { alertas, naoLidas: alertasNaoLidas, marcarLida, marcarTodasLidas } = useAlertas()
  const { currentOrg } = useOrganizationContext()

  // "O que há de novo" — exibir para orgs com versão desatualizada (não para fartech admins)
  const needsWhatsNew =
    !!currentOrg &&
    currentOrg.onboarding_version !== null &&
    currentOrg.onboarding_version !== APP_VERSION &&
    !isFartechAdmin
  const [whatsNewDismissed, setWhatsNewDismissed] = React.useState(false)
  const showWhatsNew = needsWhatsNew && !whatsNewDismissed

  const appNavGroups = React.useMemo(() => {
    const groups: { label: string; items: NavItem[] }[] = [
      {
        label: 'Operacao',
        items: [
          { label: 'Dashboard',     to: '/app/dashboard',      icon: LayoutDashboard },
          { label: 'Agenda',        to: '/app/agenda',         icon: CalendarClock },
          { label: 'Tarefas',       to: '/app/tarefas',        icon: ListTodo },
          ...(canUseTimesheet ? [{ label: 'Timesheet', to: '/app/timesheet', icon: Clock }] : []),
        ],
      },
      {
        label: 'Relacionamento',
        items: [
          { label: 'Leads',    to: '/app/leads',    icon: Flame },
          { label: 'Clientes', to: '/app/clientes', icon: UserRound },
          { label: 'Casos',    to: '/app/casos',    icon: Briefcase },
        ],
      },
      {
        label: 'Conteudo',
        items: [
          { label: 'Documentos',     to: '/app/documentos',     icon: FileText },
          ...(canUseTemplates ? [{ label: 'Templates', to: '/app/documentos/templates', icon: LayoutTemplate }] : []),
          { label: 'DataJud',        to: '/app/datajud',        icon: Database },
          ...(canUseDOU ? [{ label: 'Diário Oficial', to: '/app/diario-oficial', icon: Newspaper }] : []),
        ],
      },
    ]
    if (isOrgAdmin) {
      const governancaItems: NavItem[] = [
        ...(canUseAuditoria  ? [{ label: 'Auditoria',  to: '/app/auditoria',  icon: ShieldCheck }]     : []),
        ...(canUseAnalytics  ? [{ label: 'Analytics',  to: '/app/analytics',  icon: BarChart3 }]       : []),
        ...(canUseFinanceiro ? [{ label: 'Financeiro', to: '/app/financeiro', icon: CircleDollarSign }] : []),
      ]
      if (governancaItems.length > 0) {
        groups.push({ label: 'Governanca', items: governancaItems })
      }
    }
    return groups
  }, [isOrgAdmin, canUseDOU, canUseAuditoria, canUseAnalytics, canUseFinanceiro, canUseTimesheet, canUseTemplates])

  const apiStatusMap: Record<string, 'checking' | 'online' | 'offline'> = {
    '/app/datajud': apiHealth.datajud,
    '/app/diario-oficial': apiHealth.dou,
  }
  const [douUnreadCount, setDouUnreadCount] = React.useState(0)

  // Fetch DOU unread count periodically
  React.useEffect(() => {
    let cancelled = false
    const fetchUnread = async () => {
      try {
        const { orgId, isFartechAdmin } = await resolveOrgScope()
        if (!orgId && !isFartechAdmin) return
        const query = supabase
          .from('dou_publicacoes')
          .select('id', { count: 'exact', head: true })
          .eq('lida', false)
        const { count } = isFartechAdmin ? await query : await query.eq('org_id', orgId)
        if (!cancelled) setDouUnreadCount(count || 0)
      } catch {
        // Non-critical
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 120_000) // Every 2 minutes
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null)
  const notifRef = React.useRef<HTMLDivElement | null>(null)

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
  }, [appNavGroups, administrationItems, location.pathname])

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
    if (!notifOpen) return
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && notifRef.current?.contains(target)) return
      setNotifOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotifOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [notifOpen])

  React.useEffect(() => {
    setProfileMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    setLogoutOpen(false)
    await logLogout()
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleProfileNavigate = () => {
    setProfileMenuOpen(false)
    navigate(profilePath)
  }

  const handleSwitchUser = async () => {
    setProfileMenuOpen(false)
    await logLogout()
    await signOut()
    navigate('/login', { replace: true })
  }

  // Onboarding: tela full-screen sem sidebar
  if (location.pathname.startsWith('/app/onboarding')) {
    return (
      <OrgActiveGuard>
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <Outlet />
        </div>
      </OrgActiveGuard>
    )
  }

  return (
    <OrgActiveGuard>
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
                        <div className="shrink-0 relative" style={isActive ? { color: '#721011' } : {}}>
                          <item.icon className="h-5 w-5" />
                          {apiStatusMap[item.to] && (
                            <span
                              title={apiStatusMap[item.to] === 'online' ? 'API conectada' : apiStatusMap[item.to] === 'offline' ? 'API desconectada' : 'Verificando...'}
                              style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                border: '1.5px solid #fff',
                                backgroundColor:
                                  apiStatusMap[item.to] === 'online' ? '#22c55e'
                                  : apiStatusMap[item.to] === 'offline' ? '#ef4444'
                                  : '#a3a3a3',
                                animation: apiStatusMap[item.to] === 'checking' ? 'pulse 1.5s infinite' : undefined,
                              }}
                            />
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-left">{item.label}</span>
                        )}
                        {/* DOU unread badge */}
                        {item.to === '/app/diario-oficial' && douUnreadCount > 0 && (
                          <span
                            className={cn(
                              'inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full',
                              sidebarCollapsed ? 'absolute -top-1 -right-1 min-w-4 h-4 px-1' : 'min-w-5 h-5 px-1.5'
                            )}
                            style={{ backgroundColor: '#721011' }}
                          >
                            {douUnreadCount > 99 ? '99+' : douUnreadCount}
                          </span>
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
        className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 z-20 left-0 lg:left-64"
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

          {/* Help */}
          {hasTour(location.pathname) && (
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              title="Ajuda desta página"
              onClick={() => {
                const params = new URLSearchParams(location.search)
                if (params.get('tour') !== '1') {
                  params.set('tour', '1')
                  navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true })
                }
              }}
            >
              <HelpCircle className="h-5 w-5 text-gray-500" />
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setNotifOpen((o) => !o)}
              title={alertasNaoLidas > 0 ? `${alertasNaoLidas} notificações não lidas` : 'Notificações'}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {alertasNaoLidas > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                  style={{ backgroundColor: '#721011' }}
                >
                  {alertasNaoLidas > 99 ? '99+' : alertasNaoLidas}
                </span>
              )}
              {alertasNaoLidas === 0 && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#721011', opacity: 0.5 }}
                />
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                style={{ width: 360, maxHeight: 480 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notificações</p>
                    {alertasNaoLidas > 0 && (
                      <p className="text-xs text-gray-400">{alertasNaoLidas} não lida{alertasNaoLidas > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  {alertasNaoLidas > 0 && (
                    <button
                      onClick={() => void marcarTodasLidas()}
                      className="rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-gray-100"
                      style={{ color: '#721011' }}
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                  {alertas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">Nenhuma notificação</p>
                      <p className="text-xs text-gray-400">Você está em dia.</p>
                    </div>
                  ) : (
                    alertas.slice(0, 30).map((alerta) => {
                      const prioColor = alerta.prioridade === 'P0' ? '#dc2626' : alerta.prioridade === 'P1' ? '#d97706' : '#6b7280'
                      const isUnread = !alerta.lida
                      return (
                        <button
                          key={alerta.id}
                          className={cn(
                            'w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50',
                            isUnread && 'bg-red-50/40',
                          )}
                          onClick={() => {
                            void marcarLida(alerta.id)
                            if (alerta.action_href) {
                              setNotifOpen(false)
                              navigate(alerta.action_href)
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Unread dot */}
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: isUnread ? prioColor : 'transparent', border: isUnread ? 'none' : '1.5px solid #d1d5db' }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                  style={{ backgroundColor: prioColor }}
                                >
                                  {alerta.prioridade}
                                </span>
                                <p className={cn('truncate text-xs font-medium', isUnread ? 'text-gray-900' : 'text-gray-500')}>
                                  {alerta.titulo}
                                </p>
                              </div>
                              {alerta.descricao && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{alerta.descricao}</p>
                              )}
                              <p className="mt-1 text-[10px] text-gray-300">
                                {new Date(alerta.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
        "transition-all duration-300 pt-16",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Outlet />
      </main>

      {/* Logout Modal — custom overlay for a polished look */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setLogoutOpen(false)}
          />

          {/* Card */}
          <div
            className="relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxWidth: 420, animation: 'logoutPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Red accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' }} />

            <div style={{ padding: '32px 28px 28px' }}>
              {/* Icon */}
              <div className="flex justify-center">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 64, height: 64,
                    background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.05) 100%)',
                    border: '2px solid rgba(220,38,38,0.15)',
                  }}
                >
                  <Power className="h-6 w-6" style={{ color: '#dc2626' }} />
                </div>
              </div>

              {/* Text */}
              <h3 style={{
                marginTop: 20, textAlign: 'center',
                fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.3,
              }}>
                Deseja sair do sistema?
              </h3>
              <p style={{
                marginTop: 8, textAlign: 'center',
                fontSize: 14, color: '#64748b', lineHeight: 1.5,
              }}>
                Sua sessão será encerrada com segurança. Você precisará fazer login novamente para acessar.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button
                  onClick={() => setLogoutOpen(false)}
                  style={{
                    flex: 1, padding: '12px 20px',
                    fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    color: '#374151', background: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#d1d5db' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1, padding: '12px 20px',
                    fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    border: 'none', borderRadius: 12,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(220,38,38,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  Sair do sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal "O que há de novo" — orgs com versão desatualizada */}
      <WhatsNewModal
        open={showWhatsNew}
        onClose={() => setWhatsNewDismissed(true)}
      />

      {/* Tour de onboarding — aparece quando URL contém ?tour=1 */}
      <TourModal />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes logoutPopIn {
          0% { opacity: 0; transform: scale(0.85) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

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
    </OrgActiveGuard>
  )
}
