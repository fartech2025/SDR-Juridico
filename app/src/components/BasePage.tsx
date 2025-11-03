import React from "react";

interface BasePageProps {
  children: React.ReactNode;
  maxWidth?: string; // Ex: 'max-w-md', 'max-w-3xl'
  className?: string;
}

import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function BasePage({ children, maxWidth = "max-w-md", className = "" }: BasePageProps) {
  // URL da logo (carregada assincronamente: tenta signed url, depois public url)
  const [logoUrl, setLogoUrl] = React.useState<string>("");
  const [imgError, setImgError] = React.useState(false);

  // Permite sobrescrever a logo via variável de ambiente VITE_LOGO_URL (útil em produção)
  const envLogo = (import.meta.env.VITE_LOGO_URL as string | undefined)?.trim();

  React.useEffect(() => {
    if (envLogo) {
      setLogoUrl(envLogo);
      return;
    }
    let mounted = true;
    const loadLogo = async () => {
      try {
        // 1) tente URL assinada (funciona com buckets privados)
        const signed = await supabase.storage.from('Imagens_Geral').createSignedUrl('LOGO/LOGO4.png', 60 * 60);
        if (signed?.data?.signedUrl && mounted) {
          setLogoUrl(signed.data.signedUrl);
          if (typeof window !== 'undefined') console.log('[BasePage] Logo signed URL:', signed.data.signedUrl);
          return;
        }
      } catch (e) {
        // segue para tentar publicUrl
      }

      try {
        // 2) fallback para publicUrl (se bucket for público)
        const { data } = supabase.storage.from('Imagens_Geral').getPublicUrl('LOGO/LOGO4.png');
        if (data?.publicUrl && mounted) {
          setLogoUrl(data.publicUrl);
          if (typeof window !== 'undefined') console.log('[BasePage] Logo public URL:', data.publicUrl);
        }
      } catch (e) {
        // nada
      }
    };
  loadLogo();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Patterns & Dynamic Effects */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        {/* Floating Blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl animate-spin-slow" />
        {/* Glow Effect */}
        <div className="absolute left-1/2 top-1/2 w-[120vw] h-[120vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-green-400/10 via-emerald-500/10 to-transparent rounded-full blur-2xl opacity-70 animate-pulse" style={{animationDuration:'8s'}} />
        {/* Animated Particles */}
        {[...Array(18)].map((_,i)=>(
          <div key={i} className={`absolute rounded-full bg-emerald-400/30 blur-[2px] animate-float z-0`}
            style={{
              width: `${8 + (i%4)*4}px`,
              height: `${8 + (i%3)*4}px`,
              left: `${Math.random()*100}%`,
              top: `${Math.random()*100}%`,
              animationDelay: `${(i%7)*0.7}s`,
              animationDuration: `${6 + (i%5)*2}s`,
            }}
          />
        ))}
        {/* Shine sweep */}
        <div className="absolute left-0 top-0 w-full h-full pointer-events-none animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{animationDuration:'7s'}} />
      </div>
      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-4 ${className}`}>
        {/* Top bar com logo e texto */}
  <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
          {/* Espaço reservado para a logo - se existir será exibida */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {logoUrl && !imgError ? (
              <Link to="/" aria-label="Ir para início" className="relative inline-block">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-80 bg-gradient-to-tr from-emerald-400/30 via-green-300/20 to-transparent" />
                <img
                  src={logoUrl}
                  alt="Logo ENEM"
                  className="relative w-20 h-20 rounded-full object-contain shadow-2xl transition-transform duration-300 ease-out hover:scale-105"
                  draggable={false}
                  onError={() => setImgError(true)}
                  style={{ background: 'transparent' }}
                />
              </Link>
            ) : (
              // mantém o espaço reservado mesmo sem imagem
              <div className="w-20 h-20 rounded-full bg-transparent" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col ml-3">
            <span className="font-bold text-lg text-white leading-tight drop-shadow">ENEM Ultra</span>
            <span className="text-xs text-slate-200 opacity-80 leading-tight drop-shadow">Plataforma Inteligente de Preparação</span>
          </div>
        </div>
        <div className={`w-full ${maxWidth} flex-1 flex flex-col items-center justify-center`}>
          {children}
        </div>
      </div>
    </div>
  );
}
