/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1565B1',
          light: '#C8E0F8',
          dark: '#0D47A1',
        }
      },
    },
  },
  plugins: [],
}
