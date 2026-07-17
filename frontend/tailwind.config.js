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
        primary: {
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d2d2d7',
          300: '#86868b',
          400: '#515154',
          500: '#1d1d1f', // Apple Charcoal
          600: '#1c1c1e',
          700: '#121213',
          800: '#000000',
        },
        accent: {
          blue: '#0071e3', // Apple Blue
          gold: '#b49973',
          silver: '#e3e4e5',
          grey: '#f5f5f7',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
