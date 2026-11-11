/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          beige: '#F5F5DC',
          navy: '#0A192F',
          green: '#4A5D23',
          gold: '#D4AF37',
          white: '#FFFFFF',
          light: '#F8F9FA'
        }
      }
    },
  },
  plugins: [],
}
