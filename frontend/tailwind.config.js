/** @type {import('tailwindcss').Config} */

// Colours are CSS variables (RGB channels, so `/opacity` modifiers work) defined
// per club theme in index.css.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // The world of the club hall: the table top, its painted lines, the ball.
        table: { DEFAULT: v('table'), light: v('table-light') },
        chalk: v('chalk'), // painted table lines; text on the table
        ball: { DEFAULT: v('ball'), dark: v('ball-dark') }, // the one accent; `dark` is for text
        'on-ball': v('on-ball'), // text on a ball-coloured fill
        hall: v('hall'), // page background
        paper: v('paper'), // panel surface
        ink: v('ink'), // body text
        muted: v('muted'), // secondary text
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        // Tinted to the table, light from above.
        lift: '0 1px 0 rgb(var(--c-table) / 0.06), 0 6px 18px -8px rgb(var(--c-table) / 0.25)',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
