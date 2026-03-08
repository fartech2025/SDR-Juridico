import * as React from 'react'

export interface PageHeaderProps {
  icon: React.ElementType
  eyebrow: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, eyebrow, title, subtitle, actions }) => (
  <div
    className="rounded-3xl border p-6 shadow-sm"
    style={{ background: 'linear-gradient(135deg, #fdf8f8 0%, #f9f0f0 100%)', borderColor: '#f0e8e8' }}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #4A0B0C, #721011)' }}
        >
          <Icon className="h-6 w-6" style={{ color: '#e8c97a' }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#c9a84c' }}>{eyebrow}</p>
          <h1 className="text-2xl font-semibold text-text">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
)
