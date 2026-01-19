import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Desativar dark mode - apenas modo claro
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          primary: 'var(--brand-primary)',
          'primary-dark': 'var(--brand-primary-dark)',
          'primary-light': 'var(--brand-primary-light)',
          'primary-subtle': 'var(--brand-primary-subtle)',
          secondary: 'var(--brand-secondary)',
          'secondary-dark': 'var(--brand-secondary-dark)',
          'secondary-light': 'var(--brand-secondary-light)',
          'secondary-subtle': 'var(--brand-secondary-subtle)',
          accent: 'var(--brand-accent)',
          'accent-dark': 'var(--brand-accent-dark)',
          'accent-light': 'var(--brand-accent-light)',
        },
        // Surface Colors
        base: 'var(--color-base)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
          alt: 'var(--color-surface-alt)',
          raised: 'var(--color-surface-raised)',
          hover: 'var(--color-surface-hover)',
          elevated: 'var(--color-surface-elevated)',
        },
        // Text Colors
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
        },
        // Border Colors
        border: {
          DEFAULT: 'var(--color-border)',
          soft: 'var(--color-border-soft)',
          strong: 'var(--color-border-strong)',
          subtle: 'var(--color-border-soft)', /* Alias para soft */
          focus: 'var(--color-border-focus)',
        },
        // Semantic Colors
        success: {
          DEFAULT: 'var(--color-success)',
          dark: 'var(--color-success-dark)',
          light: 'var(--color-success-light)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          dark: 'var(--color-warning-dark)',
          light: 'var(--color-warning-light)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          dark: 'var(--color-danger-dark)',
          light: 'var(--color-danger-light)',
          bg: 'var(--color-danger-bg)',
          border: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          dark: 'var(--color-info-dark)',
          light: 'var(--color-info-light)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        pill: 'var(--radius-pill)',
        circle: 'var(--radius-circle)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
        panel: 'var(--shadow-panel)',
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
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
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        'ease-in': 'var(--ease-in)',
        'ease-out': 'var(--ease-out)',
        'ease-in-out': 'var(--ease-in-out)',
      },
      zIndex: {
        base: '0',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        notification: '1080',
      },
      // Corrigir warnings do Tailwind
      backgroundImage: {
        'linear-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'linear-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'linear-to-l': 'linear-gradient(to left, var(--tw-gradient-stops))',
        'linear-to-t': 'linear-gradient(to top, var(--tw-gradient-stops))',
        'linear-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
