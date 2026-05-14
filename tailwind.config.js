/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['var(--theme-font,Prompt)', 'sans-serif'],
        prompt: ['Prompt', 'sans-serif'],
        inter:  ['Inter', 'sans-serif'],
        kanit:  ['Kanit', 'sans-serif'],
      },

      // ── CSS-variable-based color tokens ──────────────────────────────
      // Using R G B space-separated format so Tailwind opacity modifiers
      // (bg-accent/20, text-primary/60, etc.) work correctly at runtime.
      colors: {
        // Core brand
        primary: {
          DEFAULT: 'rgb(var(--tw-primary) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'var(--theme-sidebar-bg, #1E1E1E)',
          light:   '#2A2A2A',
        },
        accent: {
          DEFAULT: 'rgb(var(--tw-accent)       / <alpha-value>)',
          light:   'rgb(var(--tw-accent-light)  / <alpha-value>)',
          dark:    'rgb(var(--tw-accent-dark)   / <alpha-value>)',
          muted:   'rgb(var(--tw-accent)        / 0.15)',
        },
        // Surfaces
        surface: {
          DEFAULT: 'rgb(var(--tw-surface) / <alpha-value>)',
          card:    'rgb(var(--tw-card)    / <alpha-value>)',
        },
        // Semantic
        success: 'rgb(var(--tw-success) / <alpha-value>)',
        warning: 'rgb(var(--tw-warning) / <alpha-value>)',
        danger:  'rgb(var(--tw-danger)  / <alpha-value>)',
        info:    'rgb(var(--tw-info)    / <alpha-value>)',
        // Text
        'theme-text':       'rgb(var(--tw-text)         / <alpha-value>)',
        'theme-text-muted': 'rgb(var(--tw-text-muted)   / <alpha-value>)',
        'theme-border':     'rgb(var(--tw-border)       / <alpha-value>)',
      },

      // ── Shadows ───────────────────────────────────────────────────────
      boxShadow: {
        glass:       '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        card:        'var(--theme-shadow,    0 2px 20px rgba(0,0,0,0.06))',
        'card-hover':'var(--theme-shadow-lg, 0 8px 30px rgba(0,0,0,0.12))',
        gold:        '0 4px 20px rgba(var(--tw-accent), 0.25)',
        'inner-gold':'inset 0 0 0 1px rgba(var(--tw-accent), 0.3)',
        glow:        '0 0 20px rgba(var(--tw-accent), 0.30)',
      },

      // ── Radius ────────────────────────────────────────────────────────
      borderRadius: {
        'card': 'var(--r-card,  1rem)',
        'btn':  'var(--r-btn,   0.75rem)',
        'input':'var(--r-input, 0.75rem)',
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
      },

      // ── Spacing ───────────────────────────────────────────────────────
      spacing: {
        'sidebar': 'var(--sidebar-w, 15rem)',
      },

      // ── Backdrop blur ─────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
      },

      // ── Animations ────────────────────────────────────────────────────
      animation: {
        'fade-in':   'fadeIn  0.4s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'slide-down':'slideDown 0.35s ease-out',
        'scale-in':  'scaleIn 0.3s ease-out',
        'pulse':     'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'kpi-pulse': 'kpi-pulse 2s infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'shimmer':   'shimmer 1.5s infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'kpi-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(var(--tw-accent), 0.40)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(var(--tw-accent), 0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
