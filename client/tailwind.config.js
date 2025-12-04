/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        runeterra: {
          gold: '#C9AA71',
          dark: '#0A1428',
          blue: '#0BC6E3',
          purple: '#7B68EE',
          lightPurple: '#E6E0FF',
        }
      },
      fontFamily: {
        'runeterra': ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}

