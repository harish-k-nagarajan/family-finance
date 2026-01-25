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
        // Dark mode colors
        navy: {
          900: '#0A0E27',
          800: '#111633',
          700: '#1A1F3A',
          600: '#252B4A',
        },
        // Accent colors
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        purple: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        electric: {
          blue: '#3B82F6',
        },
        // Light mode colors
        soft: {
          white: '#F8F9FC',
          gray: '#F3F4F6',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Clash Display', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      scale: {
        '102': '1.02',
      },
      backdropBlur: {
        lg: '16px',
      },
      transitionDuration: {
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
