import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        'border-soft': 'var(--color-border-soft)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        primary: 'var(--color-primary)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        soft: 'var(--shadow-soft)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--font-xs)',
        sm: 'var(--font-sm)',
        base: 'var(--font-base)',
        lg: 'var(--font-lg)',
        xl: 'var(--font-xl)',
        '2xl': 'var(--font-2xl)',
        '3xl': 'var(--font-3xl)',
        '4xl': 'var(--font-4xl)',
      },
    },
  },
  plugins: [],
}

export default config
