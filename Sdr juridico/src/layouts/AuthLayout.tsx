import type { ReactNode } from 'react'

import authHero from '@/assets/auth-hero.svg'
import { cn } from '@/utils/cn'

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
  
  return (
  <div
    className={cn(
      'relative min-h-screen px-6 py-12',
      className,
    )}
    style={{
      backgroundColor: '#f0f4f8',
      backgroundImage:'radial-gradient(1200px 720px at 80% -10%, rgba(59,130,246,0.12), transparent 55%), radial-gradient(960px 620px at 12% 0%, rgba(16,185,129,0.08), transparent 50%)',
    }}
  >
    <div className="mx-auto max-w-6xl">
      {title ? (
        <h1 className="text-center text-4xl font-semibold tracking-[0.35em] text-slate-800">
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
          className="rounded-2xl border border-slate-200 bg-white px-10 py-9 shadow-xl"
        >
          {children}
        </div>
        <div
          className="relative min-h-140 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-brand-primary-subtle via-white to-brand-accent-100 shadow-xl"
        >
          <div className="absolute right-6 top-6 flex items-center gap-3 text-xs text-slate-600">
            <span className="uppercase tracking-[0.18em]">{sideTitle}</span>
            <button
              type="button"
              className="rounded-full bg-brand-primary px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-primary-dark transition"
            >
              Cadastrar
            </button>
          </div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(114,16,17,0.15) 0, transparent 38%), radial-gradient(circle at 75% 60%, rgba(191,111,50,0.12) 0, transparent 40%)',
          }} />
          <div className="relative flex h-full items-center justify-center px-10 py-16">
            <img
              src={authHero}
              alt="Ilustracao juridica"
              className="max-h-105 w-full object-contain"
            />
          </div>
          {sideSubtitle ? (
            <div className="absolute left-10 top-16 max-w-sm space-y-3 drop-shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                SDR Jurídico Online
              </p>
              <h2 className="text-2xl font-semibold leading-tight text-slate-800">{sideSubtitle}</h2>
              <p className="text-sm text-slate-600">
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
