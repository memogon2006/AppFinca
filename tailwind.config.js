/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ranch: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#cddbc9',
          300: '#a6c1a0',
          400: '#79a272',
          500: '#56844e',
          600: '#43693c',
          700: '#365330',
          800: '#2d4328',
          900: '#263823',
          950: '#111e0f',
        },
        earth: {
          50: '#fbf8f4',
          100: '#f5efe6',
          200: '#ebdccb',
          300: '#dec2a7',
          400: '#cfa27f',
          500: '#be835c',
          600: '#aa6c4c',
          700: '#8d553e',
          800: '#734636',
          900: '#603b2f',
          950: '#341d17',
        }
      }
    },
  },
  plugins: [],
}
