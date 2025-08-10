/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jarvi-blue': '#00E5FF',
        'jarvi-dark': '#0A0E27',
        'jarvi-accent': '#FF6B35',
        'jarvi-glow': '#00FFFF',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF' },
          'to': { boxShadow: '0 0 20px #00E5FF, 0 0 30px #00E5FF' }
        }
      },
      fontFamily: {
        'tech': ['Orbitron', 'monospace'],
      }
    },
  },
  plugins: [],
}