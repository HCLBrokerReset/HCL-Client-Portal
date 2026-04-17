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
        // Core brand
        navy: {
          DEFAULT: '#0D1B2A',
          2: '#12243B',
          3: '#132D52',
          4: '#243B63',
          ink: '#081225',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#F7D26F',
        },
        // Vibrant accents
        royal: '#2447F9',
        cyan: '#3BC9F5',
        coral: '#FF7A59',
        // Semantic
        emerald: {
          DEFAULT: '#17B26A',
          bright: '#3DD598',
        },
        surface: {
          DEFAULT: '#EFF3FF',
          app: '#F4F7FF',
        },
      },
      backgroundImage: {
        'app-gradient': 'radial-gradient(circle at top, #335dff 0%, #0d1b2a 38%, #07111f 100%)',
        'app-gradient-dark': 'radial-gradient(circle at top, #213a9c 0%, #081225 40%, #040914 100%)',
        'btn-primary': 'linear-gradient(135deg, #2447F9, #3BC9F5)',
        'btn-gold': 'linear-gradient(135deg, #F7D26F, #C9A84C)',
        'btn-success': 'linear-gradient(135deg, #17B26A, #3DD598)',
        'btn-alert': 'linear-gradient(135deg, #FF7A59, #F7A35C)',
        'btn-dark': 'linear-gradient(135deg, #0D1B2A, #132D52)',
        'btn-deep': 'linear-gradient(135deg, #0D1B2A, #2447F9)',
        'tile-blue': 'linear-gradient(135deg, #2447F9, #4D79FF)',
        'tile-alert': 'linear-gradient(135deg, #FF7A59, #F7A35C)',
        'tile-success': 'linear-gradient(135deg, #17B26A, #3DD598)',
        'tile-dark': 'linear-gradient(135deg, #0D1B2A, #243B63)',
        'card-hero': 'linear-gradient(135deg, #2447F9, #3BC9F5)',
        'card-dark': 'linear-gradient(135deg, #0D1B2A, #132D52)',
        'bar-blue': 'linear-gradient(90deg, #2447F9, #3BC9F5)',
        'bar-alert': 'linear-gradient(90deg, #FF7A59, #F7A35C)',
        'bar-success': 'linear-gradient(90deg, #17B26A, #3DD598)',
        'hcl-gold': 'linear-gradient(135deg, #F7D26F, #C9A84C)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card': '0 12px 35px rgba(16, 24, 40, 0.10)',
        'card-dark': '0 12px 35px rgba(0, 0, 0, 0.3)',
        'premium': '0 4px 24px rgba(13, 27, 42, 0.08)',
        'premium-lg': '0 8px 48px rgba(13, 27, 42, 0.12)',
        'btn': '0 4px 20px rgba(36, 71, 249, 0.35)',
        'gold': '0 4px 20px rgba(201, 168, 76, 0.30)',
        'hero': '0 25px 60px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
