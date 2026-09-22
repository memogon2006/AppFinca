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
        arva: {
          forest: '#07503f',       // Forest Ink (Primary brand)
          lime: '#e8fe85',         // Vivid Lime (Promotional accent)
          bone: '#f1efdf',         // Bone Canvas (Warm page canvas)
          white: '#ffffff',        // Pure White
          ash: '#efefef',          // Ash Gray
          charcoal: '#212529',     // Charcoal (Text)
          graphite: '#353535',     // Graphite
          pewter: '#6d6d6d',       // Pewter
          sky: '#b2cee7',          // Sky Card pastel
          peach: '#fceace',        // Peach Card pastel
          sage: '#e6ecd5',         // Sage Card pastel
          moss: '#c3cda7',         // Moss border
        },
        ranch: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#cddbc9',
          300: '#a6c1a0',
          400: '#79a272',
          500: '#07503f', // mapped to Arva forest
          600: '#064234',
          700: '#05352a',
          800: '#04271f',
          900: '#031a15',
          950: '#020e0b',
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
      },
      borderRadius: {
        'card': '20px',
        'pill': '100px',
        'nav-pill': '110px',
        'input': '33px',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      }
    },
  },
  plugins: [],
}
