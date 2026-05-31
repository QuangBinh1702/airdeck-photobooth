/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0d12',
        panel: '#141821',
        accent: '#5eead4',
        accent2: '#a78bfa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'tour-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'spot-pulse': {
          '0%,100%': { boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 2px rgba(94,234,212,0.9)' },
          '50%': { boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 6px rgba(94,234,212,0.45)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1s ease-out infinite',
        'tour-in': 'tour-in 0.28s cubic-bezier(0.16,1,0.3,1)',
        'spot-pulse': 'spot-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
