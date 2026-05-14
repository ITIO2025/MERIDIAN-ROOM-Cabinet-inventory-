/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
        prompt: ['Prompt', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#111111',
          dark: '#0A0A0A',
        },
        secondary: {
          DEFAULT: '#1E1E1E',
          light: '#2A2A2A',
        },
        accent: {
          DEFAULT: '#C6A969',
          light: '#D4BB85',
          dark: '#A8904F',
          muted: '#C6A96933',
        },
        surface: {
          DEFAULT: '#F7F7F7',
          card: '#FFFFFF',
          dark: '#F0F0F0',
        },
        success: '#00A86B',
        warning: '#FFB800',
        danger: '#E53935',
        info: '#2196F3',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        card: '0 2px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
        gold: '0 4px 20px rgba(198,169,105,0.25)',
        'inner-gold': 'inset 0 0 0 1px rgba(198,169,105,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
