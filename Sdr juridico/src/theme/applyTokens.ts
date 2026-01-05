import { tokens } from './tokens'

const tokenEntries: Record<string, string> = {
  '--color-base': tokens.colors.base,
  '--color-surface': tokens.colors.surface,
  '--color-surface-2': tokens.colors.surfaceAlt,
  '--color-surface-alt': tokens.colors.surfaceAlt,
  '--color-surface-raised': tokens.colors.surfaceRaised,
  '--color-border': tokens.colors.border,
  '--color-border-soft': tokens.colors.borderSoft,
  '--color-text': tokens.colors.text,
  '--color-text-muted': tokens.colors.textMuted,
  '--color-text-subtle': tokens.colors.textSubtle,
  '--color-primary': tokens.colors.primary,
  '--color-primary-soft': tokens.colors.primarySoft,
  '--color-accent': tokens.colors.accent,
  '--color-success': tokens.colors.success,
  '--color-warning': tokens.colors.warning,
  '--color-danger': tokens.colors.danger,
  '--color-info': tokens.colors.info,
  '--radius-sm': tokens.radius.sm,
  '--radius-md': tokens.radius.md,
  '--radius-lg': tokens.radius.lg,
  '--radius-pill': tokens.radius.pill,
  '--shadow-panel': tokens.shadow.panel,
  '--shadow-soft': tokens.shadow.soft,
  '--auth-bg': tokens.auth.background,
  '--auth-surface': tokens.auth.surface,
  '--auth-border': tokens.auth.border,
  '--auth-text': tokens.auth.text,
  '--auth-text-muted': tokens.auth.textMuted,
  '--auth-primary': tokens.auth.primary,
  '--auth-input-bg': tokens.auth.inputBg,
  '--auth-input-border': tokens.auth.inputBorder,
  '--auth-shadow': tokens.auth.shadow,
  '--agenda-bg': tokens.agenda.background,
  '--agenda-card': tokens.agenda.card,
  '--agenda-border': tokens.agenda.border,
  '--agenda-grid': tokens.agenda.grid,
  '--agenda-shadow': tokens.agenda.shadow,
  '--agenda-shadow-soft': tokens.agenda.shadowSoft,
  '--space-xs': tokens.spacing.xs,
  '--space-sm': tokens.spacing.sm,
  '--space-md': tokens.spacing.md,
  '--space-lg': tokens.spacing.lg,
  '--space-xl': tokens.spacing.xl,
  '--space-2xl': tokens.spacing['2xl'],
}

export const applyThemeTokens = (root: HTMLElement = document.documentElement) => {
  root.style.colorScheme = 'light'
  Object.entries(tokenEntries).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
