/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          50: '#1a2f45',
          100: '#0D1B2A',
          200: '#08111a',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#f0e4b8',
          100: '#e0c97a',
          200: '#C9A84C',
          300: '#a8863d',
          400: '#8a6d30',
        },
        surface: '#F5F5F3',
        'surface-dark': '#1a2535',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 24px rgba(13, 27, 42, 0.08)',
        'premium-lg': '0 8px 48px rgba(13, 27, 42, 0.12)',
        'gold': '0 4px 24px rgba(201, 168, 76, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
