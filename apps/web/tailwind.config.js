/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F7F8FB',
          100: '#EEF0F6',
          200: '#D9DDEA',
          300: '#B7BED1',
          400: '#8990AB',
          500: '#5C6483',
          600: '#3F4664',
          700: '#2A2F48',
          800: '#1A1E33',
          900: '#0F1226',
          950: '#080A1A',
        },
        violetx: {
          50: '#F4F1FF',
          100: '#EAE3FF',
          200: '#D6CAFF',
          300: '#B79CFF',
          400: '#9070FA',
          500: '#7048E8',
          600: '#5A33CC',
          700: '#4625A3',
          800: '#321B7A',
          900: '#221256',
        },
        canvas: {
          light: '#FAFAF7',
          dark: '#0B0E1F',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,18,38,0.04), 0 4px 18px -8px rgba(15,18,38,0.18)',
        glow: '0 12px 32px -12px rgba(112,72,232,0.45)',
        ring: '0 0 0 1px rgba(112,72,232,0.45), 0 18px 60px -28px rgba(112,72,232,0.55)',
      },
      backgroundImage: {
        'grid-light':
          'radial-gradient(circle at 1px 1px, rgba(15,18,38,0.06) 1px, transparent 0)',
        'grid-dark':
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'pop-in': 'pop-in 240ms cubic-bezier(.21,1.02,.73,1)',
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        snap: 'cubic-bezier(0.21, 1.02, 0.73, 1)',
      },
    },
  },
  plugins: [],
};
