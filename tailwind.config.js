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
        studio: {
          950: '#0a0b0e',
          900: '#111318',
          850: '#161922',
          800: '#1c202c',
          750: '#232938',
          700: '#2d3446',
          600: '#3d465c',
          500: '#535f7a',
          400: '#7e8ba6',
          300: '#a5b0c7',
          200: '#cbd3e3',
          100: '#e8ecf4',
          50: '#f4f6fa',
        },
        accent: {
          500: '#6366f1',
          600: '#4f46e5',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      screens: {
        'xs': '420px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(99, 102, 241, 0.25)',
        'glow-md': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
      }
    },
  },
  plugins: [],
}
