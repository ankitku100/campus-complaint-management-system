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
        neon: {
          DEFAULT: '#B6FF5C',
          dark: '#9edf45',
          light: '#c8ff80',
          bg: '#162409', // Neon tinted dark background
        },
        dark: {
          bg: '#0F172A', // Sleek dashboard layout background (Slate 900)
          card: '#1E293B', // Card background (Slate 800)
          border: '#334155', // Dark border (Slate 700)
          text: '#94A3B8', // Dark text secondary (Slate 400)
        }
      },
      borderRadius: {
        'card': '20px',
        'card-lg': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(182, 255, 92, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 15px rgba(182, 255, 92, 0.4)',
      }
    },
  },
  plugins: [],
}
