import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#EEF2F9',
        card: '#FFFFFF',
        surface: '#F8FAFC',
        'surface-hover': '#F1F5F9',
        muted: '#E2E8F0',
        line: '#D8DEE8',
        ink: '#0F172A',
        'ink-secondary': '#475569',
        'ink-muted': '#64748B',
        'ink-faint': '#94A3B8',
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        'primary-light': '#60A5FA',
        accent: '#0D9488',
        'accent-soft': '#CCFBF1',
        'accent-warm': '#EA580C',
        success: '#059669',
        warning: '#CA8A04',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        pill: '999px',
      },
      backdropBlur: {
        card: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-lg':
          '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        nav: '0 -4px 24px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'count-up': 'countUp 1s ease-out forwards',
        blob: 'blob 8s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.9)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
