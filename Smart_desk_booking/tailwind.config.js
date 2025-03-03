/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via a CSS class
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0C184F', // Company Dark Blue
        secondary: '#7E49D5', // Supporting Purple
        accent: '#039197', // Teal Accent
        backgroundLight: '#F9FAFB',
        backgroundDark: '#0F1420',
        textLight: '#A5A5A5',
        textDark: '#EEEEEE',
      },
    },
  },
  plugins: [],
};
