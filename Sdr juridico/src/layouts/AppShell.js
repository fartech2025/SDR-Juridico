import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
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
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIsFartechAdmin } from "@/hooks/useIsFartechAdmin";
import { useIsOrgAdmin } from "@/hooks/useIsOrgAdmin";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FontSizeButton } from "@/components/FontSizeControl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/utils/cn";
import { auditService, sessionService } from "@/services/auditService";
const navItems = [
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
  { label: "Leads", to: "/app/leads", icon: Users },
  { label: "Clientes", to: "/app/clientes", icon: UserRound },
  { label: "Casos", to: "/app/casos", icon: Briefcase },
  { label: "Agenda", to: "/app/agenda", icon: CalendarClock },
  { label: "Documentos", to: "/app/documentos", icon: FileText },
  { label: "Indicadores", to: "/app/indicadores", icon: BarChart3 },
  { label: "Configuracoes", to: "/app/config", icon: Settings }
];
const adminNavItems = [
  { label: "Painel de gestao", to: "/admin/organizations", icon: LayoutDashboard }
];
const orgAdminNavItems = [
  { label: "Configuracoes Org", to: "/org/settings", icon: Settings },
  { label: "Usuarios da Org", to: "/org/users", icon: Users }
];
const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { displayName, shortName, initials, roleLabel } = useCurrentUser();
  const isFartechAdmin = useIsFartechAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const profilePath = React.useMemo(() => {
    if (location.pathname.startsWith("/admin")) return "/admin/perfil";
    if (location.pathname.startsWith("/org")) return "/org/perfil";
    return "/app/perfil";
  }, [location.pathname]);
  usePageTracking();
  React.useEffect(() => {
    console.log("\u{1F464} AppShell User Info:", {
      displayName,
      isFartechAdmin,
      isOrgAdmin,
      location: location.pathname
    });
  }, [displayName, isFartechAdmin, isOrgAdmin, location.pathname]);
  React.useEffect(() => {
    if (isFartechAdmin && location.pathname.startsWith("/app")) {
      navigate("/admin/organizations", { replace: true });
    }
  }, [isFartechAdmin, location.pathname, navigate]);
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const handlePointer = (event) => {
      const target = event.target;
      if (target && profileMenuRef.current?.contains(target)) return;
      setProfileMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [profileMenuOpen]);
  React.useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);
  const handleLogout = async () => {
    setLogoutOpen(false);
    await auditService.logLogout();
    sessionService.end();
    await signOut();
    navigate("/login", { replace: true });
  };
  const handleProfileNavigate = () => {
    setProfileMenuOpen(false);
    navigate(profilePath);
  };
  const handleSwitchUser = async () => {
    setProfileMenuOpen(false);
    await auditService.logLogout();
    sessionService.end();
    await signOut();
    navigate("/login", { replace: true });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#f7f8fc] text-text", style: { backgroundColor: "#f7f8fc", color: "#0f172a" }, children: [
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: "fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-border shadow-soft lg:flex",
        style: {
          backgroundColor: "#f7f8fc",
          borderColor: "#e2e8f0",
          background: "#f7f8fc",
          backgroundImage: "none"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-6 py-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff6aa2] via-[#ff8fb1] to-[#6aa8ff] text-white shadow-soft", children: /* @__PURE__ */ jsx(Scale, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.28em] text-text-subtle", children: "SDR" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-text", children: "Juridico Online" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "flex-1 space-y-2 px-4", children: [
            isFartechAdmin && location.pathname.startsWith("/admin") && adminNavItems.map((item) => /* @__PURE__ */ jsx(
              NavLink,
              {
                to: item.to,
                className: ({ isActive }) => cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
                ),
                children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    item.icon,
                    {
                      className: cn(
                        "h-4 w-4",
                        isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: item.label })
                ] })
              },
              item.to
            )),
            !location.pathname.startsWith("/admin") && navItems.map((item) => /* @__PURE__ */ jsx(
              NavLink,
              {
                to: item.to,
                className: ({ isActive }) => cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
                ),
                children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    item.icon,
                    {
                      className: cn(
                        "h-4 w-4",
                        isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: item.label })
                ] })
              },
              item.to
            )),
            !isFartechAdmin && isOrgAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "my-4 border-t border-border/50" }),
              orgAdminNavItems.map((item) => /* @__PURE__ */ jsx(
                NavLink,
                {
                  to: item.to,
                  className: ({ isActive }) => cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
                  ),
                  children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(
                      item.icon,
                      {
                        className: cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { children: item.label })
                  ] })
                },
                item.to
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-border/50 p-4", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: handleProfileNavigate,
              className: "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-surface-2",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white", children: initials }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium text-text", children: shortName }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: roleLabel })
                ] })
              ]
            }
          ) })
        ]
      }
    ),
    mobileMenuOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-20 lg:hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setMobileMenuOpen(false) }),
      /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-16 w-64 max-h-[calc(100vh-64px)] flex-col overflow-y-auto border-r border-border bg-white shadow-soft", children: /* @__PURE__ */ jsxs("nav", { className: "space-y-2 p-4", children: [
        isFartechAdmin && adminNavItems.map((item) => /* @__PURE__ */ jsx(
          NavLink,
          {
            to: item.to,
            onClick: () => setMobileMenuOpen(false),
            className: ({ isActive }) => cn(
              "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
            ),
            children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                item.icon,
                {
                  className: cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                  )
                }
              ),
              /* @__PURE__ */ jsx("span", { children: item.label })
            ] })
          },
          item.to
        )),
        !isFartechAdmin && navItems.map((item) => /* @__PURE__ */ jsx(
          NavLink,
          {
            to: item.to,
            onClick: () => setMobileMenuOpen(false),
            className: ({ isActive }) => cn(
              "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
            ),
            children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                item.icon,
                {
                  className: cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                  )
                }
              ),
              /* @__PURE__ */ jsx("span", { children: item.label })
            ] })
          },
          item.to
        )),
        !isFartechAdmin && isOrgAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "my-4 border-t border-border/50" }),
          orgAdminNavItems.map((item) => /* @__PURE__ */ jsx(
            NavLink,
            {
              to: item.to,
              onClick: () => setMobileMenuOpen(false),
              className: ({ isActive }) => cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                isActive ? "bg-[#E9EEFF] text-primary" : "text-text-muted hover:bg-[#F2F5FF] hover:text-text"
              ),
              children: ({ isActive }) => /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  item.icon,
                  {
                    className: cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-text-subtle group-hover:text-primary"
                    )
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: item.label })
              ] })
            },
            item.to
          ))
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b px-4 shadow-soft backdrop-blur lg:left-60 lg:px-8", style: { backgroundColor: "rgba(255,255,255,0.95)", borderColor: "#e2e8f0" }, children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 lg:hidden", children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => setMobileMenuOpen(!mobileMenuOpen),
          className: "rounded-full",
          children: mobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" })
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden items-center gap-3 lg:flex", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary", children: initials }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-text-subtle", children: "Bom dia" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-text", children: displayName })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 lg:gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative hidden items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-text-muted shadow-soft md:flex", children: [
          /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-text-subtle" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              placeholder: "Pesquisar...",
              className: "w-44 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary shadow-soft", children: "3" })
        ] }),
        /* @__PURE__ */ jsx(FontSizeButton, {}),
        /* @__PURE__ */ jsx(ThemeToggle, {}),
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "relative rounded-full", children: [
          /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "rounded-full hidden sm:inline-flex",
            onClick: () => navigate("/app/config"),
            children: [
              /* @__PURE__ */ jsx(SlidersHorizontal, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden md:inline ml-1", children: "Preferencias" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative hidden sm:flex", ref: profileMenuRef, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setProfileMenuOpen((open) => !open),
              className: "flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs text-text shadow-soft transition hover:bg-surface-2",
              "aria-haspopup": "menu",
              "aria-expanded": profileMenuOpen,
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary", children: initials }),
                /* @__PURE__ */ jsx("span", { children: shortName }),
                /* @__PURE__ */ jsx(
                  ChevronDown,
                  {
                    className: `h-3 w-3 text-text-subtle transition ${profileMenuOpen ? "rotate-180" : ""}`
                  }
                )
              ]
            }
          ),
          profileMenuOpen && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border border-border bg-white p-2 text-xs text-text shadow-soft",
              role: "menu",
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleProfileNavigate,
                    className: "w-full rounded-xl px-3 py-2 text-left font-medium text-text transition hover:bg-surface-2",
                    role: "menuitem",
                    children: "Acessar perfil"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleSwitchUser,
                    className: "w-full rounded-xl px-3 py-2 text-left font-medium text-text transition hover:bg-surface-2",
                    role: "menuitem",
                    children: "Trocar usuario"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setProfileMenuOpen(false);
                      setLogoutOpen(true);
                    },
                    className: "w-full rounded-xl px-3 py-2 text-left font-medium text-danger transition hover:bg-danger/10",
                    role: "menuitem",
                    children: "Sair"
                  }
                )
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "relative min-h-screen bg-[#f7f8fc] pt-16 lg:pl-60", children: [
      /* @__PURE__ */ jsx("div", { className: "px-4 py-6 md:px-8", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-6 right-6 opacity-10 md:bottom-10 md:right-10", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: "https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/TALENT%20SDR%20SEM%20FUNDO.png",
          alt: "Talent SDR Juridico",
          className: "w-48 max-w-[60vw] md:w-64",
          loading: "lazy"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      Modal,
      {
        open: logoutOpen,
        onClose: () => setLogoutOpen(false),
        className: "max-w-md text-center",
        footer: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              className: "flex-1",
              onClick: () => setLogoutOpen(false),
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsx(Button, { variant: "danger", className: "flex-1", onClick: handleLogout, children: "Sair" })
        ] }),
        children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger", children: /* @__PURE__ */ jsx(Power, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-text", children: "Deseja sair do sistema?" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Sua sessao sera encerrada com seguranca." })
        ] })
      }
    )
  ] });
};
export {
  AppShell
};
