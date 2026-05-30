/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        petroleum: {
          950: '#040D0F',
          900: '#071419',
          800: '#0B2127',
          700: '#0F3040',
          600: '#144055',
          500: '#1A526B',
          400: '#2A7A9E',
          300: '#4FA8C9',
          200: '#8CCFE3',
          100: '#C5EAF4',
          50:  '#EBF7FC',
        },
        amber: {
          950: '#1C0A00',
          900: '#3D1500',
          800: '#6B2800',
          700: '#9A3D00',
          600: '#C95200',
          500: '#F06400',
          400: '#F58333',
          300: '#F9A366',
          200: '#FCC399',
          100: '#FDE3CC',
          50:  '#FEF3E8',
        },
        safety: {
          red:    '#E53E3E',
          amber:  '#D97706',
          green:  '#16A34A',
          blue:   '#2563EB',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'typing': 'typing 1.2s steps(3) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        typing: {
          '0%, 100%': { content: '.' },
          '33%': { content: '..' },
          '66%': { content: '...' },
        },
      },
    },
  },
  plugins: [],
}
