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
}: AuthLayoutProps) => (
  <div
    className={cn(
      'relative min-h-screen px-6 py-12 text-(--auth-text)',
      className,
    )}
    style={{
      backgroundColor: 'var(--auth-bg)',
      backgroundImage:
        'radial-gradient(720px 420px at 85% 0%, rgba(255, 170, 210, 0.25), transparent 55%), radial-gradient(720px 420px at 10% -20%, rgba(156, 141, 255, 0.18), transparent 55%)',
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
          className="rounded-2xl border bg-white px-10 py-9 shadow-soft"
          style={{
            borderColor: 'var(--auth-border)',
            boxShadow: 'var(--auth-shadow)',
          }}
        >
          {children}
        </div>
        <div
          className="relative min-h-140 overflow-hidden rounded-2xl border bg-white shadow-soft"
          style={{
            borderColor: 'var(--auth-border)',
            boxShadow: 'var(--auth-shadow)',
            backgroundImage:
              'linear-gradient(135deg, rgba(248, 250, 255, 0.9) 0%, rgba(243, 244, 255, 0.9) 55%, rgba(255, 235, 243, 0.9) 100%)',
          }}
        >
          <div className="absolute right-6 top-6 flex items-center gap-3 text-xs text-(--auth-text-muted)">
            <span>{sideTitle}</span>
            <button
              type="button"
              className="rounded-full bg-[#ff6b8a] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-soft"
            >
              Cadastrar
            </button>
          </div>
          <div className="relative flex h-full items-center justify-center px-10 py-16">
            <img
              src={authHero}
              alt="Ilustracao juridica"
              className="max-h-105 w-full object-contain"
            />
          </div>
          {sideSubtitle ? (
            <div className="absolute left-10 top-16 max-w-sm space-y-3 text-(--auth-text)">
              <p className="text-xs uppercase tracking-[0.3em] text-(--auth-text-muted)">
                SDR Juridico Online
              </p>
              <h2 className="text-2xl font-semibold">{sideSubtitle}</h2>
              <p className="text-sm text-(--auth-text-muted)">
                Inteligencia juridica e produtividade em um unico painel.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  </div>
)
