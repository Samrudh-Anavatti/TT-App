/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Table tennis palette: the table, the ball, the net.
        table: {
          DEFAULT: '#0b3d2e', // deep table green
          light: '#155c44',
        },
        felt: '#0f4d38',
        court: '#0d3b66', // deep blue
        ball: '#ff6b35', // orange ball
        chalk: '#f7f7f2', // warm neutral background
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11,61,46,0.08), 0 8px 24px rgba(11,61,46,0.06)',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
