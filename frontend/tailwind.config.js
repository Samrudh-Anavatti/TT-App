/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Table tennis palette: the table, the ball, the net. Values are CSS
        // variables (RGB channels, so `/opacity` modifiers work) defined per club
        // theme in index.css.
        table: {
          DEFAULT: 'rgb(var(--c-table) / <alpha-value>)',
          light: 'rgb(var(--c-table-light) / <alpha-value>)',
        },
        felt: 'rgb(var(--c-felt) / <alpha-value>)',
        court: 'rgb(var(--c-court) / <alpha-value>)',
        ball: {
          DEFAULT: 'rgb(var(--c-ball) / <alpha-value>)',
          dark: 'rgb(var(--c-ball-dark) / <alpha-value>)',
        },
        chalk: 'rgb(var(--c-chalk) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgb(var(--c-table) / 0.08), 0 8px 24px rgb(var(--c-table) / 0.06)',
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
