import React from 'react';

interface BasePageProps {
  children: React.ReactNode;
  title?: string;
  logo?: string;
  className?: string;
}

export default function BasePage({ children, title = 'ENEM - Sistema de Estudos', logo, className }: BasePageProps) {
  const [logoUrl, setLogoUrl] = React.useState<string>('/favicon.svg');
  const [imgError, setImgError] = React.useState(false);

  // Permite sobrescrever a logo via variável de ambiente VITE_LOGO_URL (útil em produção)
  const envLogo = (import.meta.env.VITE_LOGO_URL as string | undefined)?.trim();
  const logoBucket = import.meta.env.VITE_LOGO_BUCKET || 'Imagens_Geral';
  const logoPath = import.meta.env.VITE_LOGO_PATH || 'LOGO/LOGO4.png';

  React.useEffect(() => {
    // Se VITE_LOGO_URL estiver configurado, usar diretamente (sem tentativas extras)
    if (envLogo) {
      setLogoUrl(envLogo);
      return;
    }
    
    // Fallback: usar logo local se nada estiver configurado
    setLogoUrl('/favicon.svg');
  }, [envLogo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden flex flex-col">
      {/* Background Patterns & Dynamic Effects - Premium */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-slate-950 to-purple-600/5" />
        
        {/* Premium Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e3a8a_0.5px,transparent_0.5px)] bg-[size:5rem_5rem] opacity-20 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
        
        {/* Floating Orbs - Refined */}
        <div className="absolute top-10 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-slate-950" />
      </div>

      {/* Header - Minimal & Clean */}
      <header className="relative z-20 border-b border-blue-900/20 bg-gradient-to-r from-slate-900/40 to-blue-900/20 backdrop-blur-xl shadow-lg">
        <div className="container-max px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center gap-4 flex-1">
              {(logo || logoUrl) && !imgError && (
                <img 
                  src={logo || logoUrl} 
                  alt="Logo" 
                  className="h-10 w-auto object-contain drop-shadow-lg hover:drop-shadow-xl transition-all"
                  onError={() => setImgError(true)}
                />
              )}
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent leading-tight">
                  {title}
                </h1>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300">Sistema Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Flex Grow */}
      <main className={`flex-1 relative z-10 overflow-y-auto ${className || ''}`}>
        <div className="container-max px-6 py-8">
          {children}
        </div>
      </main>

      {/* Footer - Minimal & Elegant */}
      <footer className="relative z-20 border-t border-blue-900/20 bg-gradient-to-r from-slate-900/50 to-blue-900/30 backdrop-blur-xl mt-auto">
        <div className="container-max px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 text-center md:text-left">
              © 2024 Sistema ENEM • Transformando resultados através da tecnologia
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">v2.0</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300">Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}