import type { ReactNode } from 'react'

import authHero from '@/assets/auth-hero.svg'
import { cn } from '@/utils/cn'
import { useTheme } from '@/contexts/ThemeContext'

interface AuthLayoutProps {
  title?: string
  children: ReactNode
  sideTitle?: string
  sideSubtitle?: string
  className?: string
}

export const AuthLayout = ({
  title,
  children,
  sideTitle = 'Nao e membro ainda?',
  sideSubtitle = '',
  className,
}: AuthLayoutProps) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
  <div
    className={cn(
      'relative min-h-screen px-6 py-12 text-(--auth-text)',
      className,
    )}
    style={{
      backgroundColor: isDark ? '#0a0f1a' : '#0b1d33',
      backgroundImage: isDark
        ? 'radial-gradient(1200px 720px at 80% -10%, rgba(20,60,120,0.35), transparent 55%), radial-gradient(960px 620px at 12% 0%, rgba(160,25,30,0.25), transparent 50%)'
        : 'radial-gradient(1200px 720px at 80% -10%, rgba(30,94,180,0.32), transparent 55%), radial-gradient(960px 620px at 12% 0%, rgba(212,32,39,0.22), transparent 50%)',
    }}
  >
    <div className="mx-auto max-w-6xl">
      {title ? (
        <h1 className="text-center text-4xl font-semibold tracking-[0.35em] text-(--auth-text)">
          {title}
        </h1>
      ) : null}
      <div
        className={cn(
          'grid gap-8 lg:grid-cols-[440px_1fr]',
          title ? 'mt-10' : 'mt-6',
        )}
      >
        <div
          className="rounded-2xl border bg-white/95 px-10 py-9 shadow-2xl backdrop-blur"
          style={{
            borderColor: 'rgba(12,39,75,0.12)',
            boxShadow:
              '0 20px 70px rgba(4,22,45,0.35), 0 4px 20px rgba(20,70,130,0.18)',
          }}
        >
          {children}
        </div>
        <div
          className="relative min-h-140 overflow-hidden rounded-2xl border bg-white/10 shadow-2xl backdrop-blur"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 20px 70px rgba(4,22,45,0.45)',
            backgroundImage:
              'linear-gradient(145deg, rgba(12,39,75,0.65) 0%, rgba(32,86,160,0.55) 45%, rgba(212,32,39,0.35) 100%)',
          }}
        >
          <div className="absolute right-6 top-6 flex items-center gap-3 text-xs text-white/80">
            <span className="uppercase tracking-[0.18em]">{sideTitle}</span>
            <button
              type="button"
              className="rounded-full bg-[#d42027] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#d42027]/30 hover:brightness-105"
            >
              Cadastrar
            </button>
          </div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0, transparent 38%), radial-gradient(circle at 75% 60%, rgba(255,255,255,0.35) 0, transparent 40%)',
          }} />
          <div className="relative flex h-full items-center justify-center px-10 py-16">
            <img
              src={authHero}
              alt="Ilustracao juridica"
              className="max-h-105 w-full object-contain"
            />
          </div>
          {sideSubtitle ? (
            <div className="absolute left-10 top-16 max-w-sm space-y-3 text-white drop-shadow">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                SDR Jurídico Online
              </p>
              <h2 className="text-2xl font-semibold leading-tight">{sideSubtitle}</h2>
              <p className="text-sm text-white/75">
                Inteligência jurídica com a força e a presença da OAB.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  </div>
)
}
