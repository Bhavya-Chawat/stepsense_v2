/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Light theme ────────────────────────────────────────────
        page:   'var(--color-page)',
        card:   'var(--color-card)',
        border: 'var(--color-border)',
        ink: {
          primary:   'var(--color-ink-primary)',
          secondary: 'var(--color-ink-secondary)',
          tertiary:  'var(--color-ink-tertiary)',
        },
        accent: {
          teal:      'var(--color-accent-teal)',
          tealLight: 'var(--color-accent-teal-light)',
          tealMuted: 'var(--color-accent-teal-muted)',
          // Legacy aliases
          clay:      'var(--color-accent-teal)',
          blue:      'var(--color-accent-teal-light)',
        },
        status: {
          good:        'var(--color-status-good)',
          goodBg:      'var(--color-status-good-bg)',
          moderate:    'var(--color-status-moderate)',
          moderateBg:  'var(--color-status-moderate-bg)',
          critical:    'var(--color-status-critical)',
          criticalBg:  'var(--color-status-critical-bg)',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: 'none',
        'card-hover': 'none',
        'card-dark': 'none',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
