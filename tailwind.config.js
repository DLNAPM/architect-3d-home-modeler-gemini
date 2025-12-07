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
        brand: {
          '50': '#f0f7ff',
          '100': '#e0eefe',
          '200': '#c7e0fe',
          '300': '#a4cbfd',
          '400': '#7ab1fc',
          '500': '#5792fb',
          '600': '#3b74f6',
          '700': '#2c5ce8',
          '800': '#284ab9',
          '900': '#234195',
          '950': '#1b2a5c',
        },
      },
      keyframes: {
        'scale-in-ver-top': {
          '0%': { transform: 'scaleY(0)', 'transform-origin': '100% 0%', opacity: '1' },
          '100%': { transform: 'scaleY(1)', 'transform-origin': '100% 0%', opacity: '1' }
        },
      },
      animation: {
        'scale-in-ver-top': 'scale-in-ver-top 0.15s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'
      }
    }
  },
  plugins: [],
}