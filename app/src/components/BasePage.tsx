import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import LiquidGlassButton from './LiquidGlassButton';
import PortugueseCorrectorWidget from './PortugueseCorrectorWidget';
import ThemeSwitcher from './ThemeSwitcher';

interface BasePageProps {
  children: React.ReactNode;
  title?: string;
  logo?: string;
  className?: string;
  contentClassName?: string;
  fullWidth?: boolean;
}

export default function BasePage({
  children,
  title = 'FARTECH',
  logo,
  className,
  contentClassName,
  fullWidth = false
}: BasePageProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const showBackHome = !['/', '/home'].includes(location.pathname);
  const isHome = location.pathname === '/home';
  const renderBackHome = showBackHome && (
    <Link
      to="/"
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 px-5 py-2 text-white font-semibold shadow-lg shadow-rose-500/30 transition hover:shadow-rose-500/50"
    >
      ← Sair
    </Link>
  );
  const [logoUrl, setLogoUrl] = React.useState<string>('/favicon.svg');
  const [imgError, setImgError] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Permite sobrescrever a logo via variável de ambiente VITE_LOGO_URL (útil em produção)
  const envLogo = (import.meta.env.VITE_LOGO_URL as string | undefined)?.trim();

  React.useEffect(() => {
    if (envLogo) {
      setLogoUrl(envLogo);
      return;
    }
    setLogoUrl('/favicon.svg');
  }, [envLogo]);

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex flex-col">
      <PortugueseCorrectorWidget />
      {/* Premium Background Effects with Enhanced Depth */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Animated Mesh Gradient - Enhanced */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.12),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        {/* Sophisticated Grid Pattern with Depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(59,130,246,0.04)_1.5px,transparent_1.5px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        
        {/* Dynamic Light Beams - More Visible */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-blue-400/30 via-blue-500/10 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-purple-400/25 via-purple-500/10 to-transparent" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-cyan-400/20 via-cyan-500/5 to-transparent" />
        
        {/* Floating Orbs - Enhanced with Better Visibility */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-500/12 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-400/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Additional Depth Layers */}
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Noise Texture Overlay - Subtle */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      </div>

      {/* Glassmorphism Header - Material Design */}
      <header className="relative z-20 border-b border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        {/* Top Accent Line - Brighter */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
        
        {/* Glass Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] pointer-events-none" />
        
        <div className="w-full px-8 py-6 relative">
          <div className="flex flex-wrap items-center justify-between gap-6 w-full">
            {/* Brand Section - Enhanced */}
            <div className="flex items-center gap-5 flex-1">
              {(logo || logoUrl) && !imgError && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <img 
                    src={logo || logoUrl} 
                    alt="Logo" 
                    className="relative h-12 w-auto object-contain drop-shadow-2xl transition-all duration-300 group-hover:scale-105"
                    onError={() => setImgError(true)}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent leading-none tracking-tight">
                  {title}
                </h1>
                <p className="text-xs text-slate-500 font-medium">Plataforma Educacional de Excelência</p>
              </div>
            </div>

            <nav className="flex items-center gap-4 text-sm font-medium">
              {!isLanding && renderBackHome}
              {isLanding && (
                <Link
                  to="/inicio"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white hover:border-blue-400/40 hover:text-blue-200 transition"
                >
                  <span role="img" aria-label="cadeado">🔐</span>
                  Login
                </Link>
              )}
              {isLanding && <div className="hidden md:block w-px h-6 bg-white/15" />}
              {isLanding && (
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-5 py-2 text-white font-semibold shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50"
                >
                  <span role="img" aria-label="administrativo">👨‍💼</span>
                  Administrativo
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
              {isLanding && (
                <Link
                  to="/sec-educacao"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-400 px-5 py-2 text-white font-semibold shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                >
                  <span role="img" aria-label="secretaria">🏫</span>
                  Sec. Educação
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </nav>

            {/* Right Section - Liquid Glass Buttons */}
            <div className="flex items-center gap-4">
              {/* Time Display - Liquid Glass */}
              <LiquidGlassButton 
                variant="info" 
                size="sm"
                className="hidden lg:flex"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </LiquidGlassButton>

              {/* Status Badge - Liquid Glass */}
              <LiquidGlassButton variant="success" size="md">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">ONLINE</span>
                </div>
              </LiquidGlassButton>
              {isHome && (
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white hover:border-rose-400/40 hover:text-rose-200 transition"
                >
                  ↩️ Sair
                </Link>
              )}
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Enhanced with Glass Cards Support */}
      <main className={`flex-1 relative z-10 overflow-y-auto ${className || ''}`}>
        <div className={`${fullWidth ? 'w-full' : 'container-max px-8 py-10'} ${contentClassName || ''}`}>
          {showBackHome && !isLanding && <div className="mb-6" />}
          {children}
        </div>
      </main>

      {/* Glassmorphism Footer - Material Design */}
      <footer className="relative z-20 border-t border-white/10 bg-white/[0.02] backdrop-blur-3xl mt-auto shadow-[0_-8px_32px_0_rgba(0,0,0,0.37)]">
        {/* Top Accent Line - Brighter */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        
        {/* Glass Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/[0.05] to-transparent pointer-events-none" />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.1)] pointer-events-none" />
        
        <div className="container-max px-8 py-8 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left Section */}
            <div className="flex flex-col items-center lg:items-start gap-2">
              <p className="text-sm text-slate-400 font-medium">
                © 2024 Sistema ENEM • Transformando Educação
              </p>
              <p className="text-xs text-slate-600">
                Tecnologia de ponta para resultados excepcionais
              </p>
            </div>

            {/* Right Section - Liquid Glass Badges */}
            <div className="flex items-center gap-4">
              {/* Version Badge - Liquid Glass */}
              <LiquidGlassButton variant="primary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-sm font-bold">v2.0.1</span>
              </LiquidGlassButton>

              {/* Status Badge - Liquid Glass */}
              <LiquidGlassButton variant="success" size="sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  <span className="text-sm font-bold">Sistema Operacional</span>
                </div>
              </LiquidGlassButton>

              {/* Performance Badge - Liquid Glass */}
              <LiquidGlassButton variant="warning" size="sm" className="hidden xl:flex">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">Alta Performance</span>
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
