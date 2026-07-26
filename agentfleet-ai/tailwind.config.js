/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        background: '#0A0F1C',
        card: 'rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0F1C 0%, #1E293B 100%)',
      },
    },
  },
  plugins: [],
}
