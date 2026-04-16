import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DoniSend design system
        primary: '#1F3A5F',
        'primary-mid': '#243B5A',
        'primary-light': '#2A5298',
        accent: '#2ECC71',
        'accent-dark': '#27AE60',
        'accent-light': '#58D68D',
        'bg-dark': '#0D1E35',
        'bg-card': '#152644',
        'bg-surface': '#1A3050',
        'bg-elevated': '#1F3A5F',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8AA8C8',
        'text-muted': '#4A6A8A',
        'text-dark': '#2F2F2F',
        success: '#2ECC71',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',

        // Backward-compatible aliases used in existing UI
        app: '#0D1E35',
        card: '#152644',
        surface: '#1A3050',
        'surface-hover': '#243B5A',
        muted: '#243B5A',
        line: 'rgba(42, 82, 152, 0.25)',
        ink: '#FFFFFF',
        'ink-secondary': '#8AA8C8',
        'ink-muted': '#4A6A8A',
        'ink-faint': '#6D88A5',
        'primary-dark': '#243B5A',
        'accent-soft': 'rgba(46, 204, 113, 0.15)',
        'accent-warm': '#F39C12',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
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
